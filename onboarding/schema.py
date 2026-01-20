import logging
from project.util.rename_dict_keys import with_keys_renamed
from typing import Optional, Dict, Any
from django.contrib.auth import login
from django.conf import settings
from django.http import HttpRequest
from django.utils import translation
import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
from django.db import transaction

from project.util.session_mutation import SessionFormMutation
from project.util.site_util import get_site_name, SITE_CHOICES
from project.util.mailing_address import US_STATE_CHOICES
from project.locales import ALL as LOCALE_CHOICES
from project import slack, schema_registry
from users.models import JustfixUser
from partnerships import referral
from project.util.model_form_util import OneToOneUserModelFormMutation
from users.email_verify import send_verification_email_async
from onboarding import forms
from onboarding.scaffolding import (
    GraphQlOnboardingScaffolding,
    OnboardingScaffoldingMutation,
    get_scaffolding,
    purge_scaffolding,
    update_scaffolding,
)
from onboarding.schema_util import mutation_requires_onboarding
from onboarding.models import OnboardingInfo, BOROUGH_CHOICES, LEASE_CHOICES, SIGNUP_INTENT_CHOICES


logger = logging.getLogger(__name__)


@schema_registry.register_mutation
class OnboardingStep1V2(OnboardingScaffoldingMutation):
    class Meta:
        form_class = forms.OnboardingStep1V2Form
        exclude = ["no_apt_number"]


@schema_registry.register_mutation
class OnboardingStep3(OnboardingScaffoldingMutation):
    class Meta:
        form_class = forms.OnboardingStep3Form


def pick_model_fields(model, **kwargs):
    """
    Return a dictionary containing only the passed-in kwargs
    that correspond to fields on the given model, e.g.:

        >>> from django.contrib.auth.models import User
        >>> pick_model_fields(User, boop=1, username='blah')
        {'username': 'blah'}
    """

    model_fields = set([field.name for field in model._meta.get_fields()])

    return {key: kwargs[key] for key in kwargs if key in model_fields}


def complete_onboarding(request, info, password: Optional[str]) -> JustfixUser:
    with transaction.atomic():
        user = JustfixUser.objects.create_user(
            username=JustfixUser.objects.generate_random_username(),
            first_name=info["first_name"],
            last_name=info["last_name"],
            preferred_first_name=info.get("preferred_first_name", ""),
            email=info["email"],
            phone_number=info["phone_number"],
            password=password,
            locale=translation.get_language_from_request(request, check_path=True),
        )

        oi = OnboardingInfo(user=user, **pick_model_fields(OnboardingInfo, **info))
        oi.full_clean()
        oi.save()

        # Check for LOC referral code and pre-fill landlord details if applicable
        if oi.signup_intent == SIGNUP_INTENT_CHOICES.LOC:
            from loc import referral as loc_referral
            referral_code = loc_referral.get_referral_code(request)
            if referral_code:
                landlord_details = loc_referral.get_landlord_details_for_referral(referral_code)
                if landlord_details:
                    from loc import models as loc_models
                    ld = loc_models.LandlordDetails._get_or_create_for_user(user)
                    ld.name = landlord_details.get("name", "")
                    ld.primary_line = landlord_details.get("primary_line", "")
                    ld.city = landlord_details.get("city", "")
                    ld.state = landlord_details.get("state", "")
                    ld.zip_code = landlord_details.get("zip_code", "")
                    ld.email = landlord_details.get("email", "")
                    ld.phone_number = landlord_details.get("phone_number", "")
                    ld.is_looked_up = False
                    ld.save()
                    # Clear the referral code from session after use
                    if loc_referral.LOC_REFERRAL_SESSION_KEY in request.session:
                        del request.session[loc_referral.LOC_REFERRAL_SESSION_KEY]

    partner = referral.get_partner(request)
    via = ""
    if partner:
        partner.users.add(user)
        via = f", via our partner {partner.name}"

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
        f"from {slack.escape(oi.city)}, {slack.escape(oi.state)} has signed up for "
        f"{slack.escape(SIGNUP_INTENT_CHOICES.get_label(oi.signup_intent))} in "
        f"{slack.escape(LOCALE_CHOICES.get_label(user.locale))}{via}!",
        is_safe=True,
    )

    user.backend = settings.AUTHENTICATION_BACKENDS[0]
    login(request, user)

    return user


class OnboardingStep4Base(SessionFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def __extract_all_step_session_data(cls, request: HttpRequest) -> Optional[Dict[str, Any]]:
        scf = get_scaffolding(request)
        if not (
            scf.first_name
            and scf.last_name
            and scf.street
            and scf.lease_type
            and scf.receives_public_assistance is not None
        ):
            return None
        return with_keys_renamed(scf.dict(), forms.OnboardingStep1V2Form.from_scaffolding_keys)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        allinfo = cls.__extract_all_step_session_data(request)
        if allinfo is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        allinfo.update(form.cleaned_data)
        password = form.cleaned_data["password"] or None
        allinfo["email"] = form.cleaned_data.get("email", "")
        allinfo["state"] = "NY"
        allinfo["agreed_to_justfix_terms"] = True
        user = complete_onboarding(request, info=allinfo, password=password)

        user.send_sms_async(
            f"Hi {user.best_first_name}, welcome to {get_site_name()}! "
            f"We’ll text updates about your letter. "
            f"Reply HELP for help and STOP to opt out."
        )

        if user.email:
            send_verification_email_async(user.pk)

        purge_scaffolding(request)

        return cls.mutation_success()


@schema_registry.register_mutation
class OnboardingStep4Version2(OnboardingStep4Base):
    class Meta:
        form_class = forms.OnboardingStep4FormVersion2


@schema_registry.register_mutation
class OnboardingStep4WithOptionalEmail(OnboardingStep4Base):
    class Meta:
        form_class = forms.OnboardingStep4WithOptionalEmailForm


@schema_registry.register_mutation
class AgreeToTerms(SessionFormMutation):
    class Meta:
        form_class = forms.AgreeToTermsForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        site_type = form.cleaned_data["site"]
        oi = request.user.onboarding_info
        if site_type == SITE_CHOICES.JUSTFIX:
            oi.agreed_to_justfix_terms = True
        elif site_type == SITE_CHOICES.NORENT:
            oi.agreed_to_norent_terms = True
        elif site_type == SITE_CHOICES.EVICTIONFREE:
            oi.agreed_to_evictionfree_terms = True
        elif site_type == SITE_CHOICES.LALETTERBUILDER:
            oi.agreed_to_laletterbuilder_terms = True
        else:
            raise AssertionError(f"Unknown site type: {site_type}")
        oi.save()
        return cls.mutation_success()


class OnboardingScaffolding(GraphQlOnboardingScaffolding):
    """
    This contains all information related to onboarding
    that needs to be stored somewhere while the user
    doesn't yet have an account.

    It may also be used for other "short-term memory" needed
    while the user is using the site.

    Under the hood, all the data under this field is stored
    in the user's session via the Django sessions framework.
    It is temporary and will eventually expire.

    Note that if the user is logged in, other GraphQL
    fields containing the same information should be preferred
    over this one, since they will be returning user data that
    is stored permanently in the database.
    """


class OnboardingInfoMutation(OneToOneUserModelFormMutation):
    class Meta:
        abstract = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        result = super().perform_mutate(form, info)
        # The OneToOneUserModelFormMutation's OnboardingInfo
        # instance is different from the one attached to our
        # user object, so we need to refresh the one one our
        # user object from the DB in order for the values
        # returned in the associated `session` property of
        # the mutation to be up-to-date.
        info.context.user.onboarding_info.refresh_from_db()
        return result


@schema_registry.register_mutation
class NycAddress(SessionFormMutation):
    class Meta:
        form_class = forms.NycAddressForm

    login_required = False

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate_for_logged_in_user(cls, form, info: ResolveInfo):
        oi = info.context.user.onboarding_info
        oi.non_nyc_city = ""
        oi.state = US_STATE_CHOICES.NY
        oi.address = form.cleaned_data["address"]
        oi.borough = form.cleaned_data["borough"]
        oi.apt_number = form.cleaned_data["apt_number"]
        oi.address_verified = form.cleaned_data["address_verified"]
        oi.full_clean()
        oi.save()

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        if info.context.user.is_authenticated:
            cls.perform_mutate_for_logged_in_user(form, info)
        else:
            update_scaffolding(
                info.context, with_keys_renamed(form.cleaned_data, form.to_scaffolding_keys)
            )

        return cls.mutation_success()


@schema_registry.register_mutation
class LeaseType(OnboardingInfoMutation):
    class Meta:
        form_class = forms.LeaseTypeForm


@schema_registry.register_mutation
class ReliefAttempts(OnboardingInfoMutation):
    class Meta:
        form_class = forms.ReliefAttemptsForm


@schema_registry.register_mutation
class PublicAssistance(OnboardingInfoMutation):
    class Meta:
        form_class = forms.PublicAssistanceForm


BoroughEnum = graphene.Enum.from_enum(BOROUGH_CHOICES.enum)

LeaseTypeEnum = graphene.Enum.from_enum(LEASE_CHOICES.enum)


class OnboardingInfoType(DjangoObjectType):
    class Meta:
        model = OnboardingInfo
        only_fields = (
            "signup_intent",
            "floor_number",
            "address",
            "apt_number",
            "pad_bbl",
            "has_called_311",
            "non_nyc_city",
            "zipcode",
            "agreed_to_justfix_terms",
            "agreed_to_norent_terms",
            "agreed_to_evictionfree_terms",
            "agreed_to_laletterbuilder_terms",
            "can_receive_rttc_comms",
            "can_receive_saje_comms",
            "receives_public_assistance",
        )

    borough = graphene.Field(
        BoroughEnum,
        description=OnboardingInfo._meta.get_field("borough").help_text,
    )

    lease_type = graphene.Field(
        LeaseTypeEnum,
        description=OnboardingInfo._meta.get_field("lease_type").help_text,
    )

    # If we specify 'state' as a model field, graphene-django will turn
    # it into an enum where the empty string value is an invalid choice,
    # so instead we'll just coerce it to a string.
    state = graphene.String(
        required=True,
        description=OnboardingInfo._meta.get_field("state").help_text,
        resolver=lambda self, context: self.state,
    )

    city = graphene.String(
        required=True,
        description=OnboardingInfo.city.__doc__.strip(),  # type: ignore
        resolver=lambda self, context: self.city,
    )

    is_in_los_angeles = graphene.Boolean(
        description=(
            "Whether the user is in Los Angeles County. If "
            "we don't have enough information to tell, this will be null."
        )
    )

    full_mailing_address = graphene.String(
        required=True,
        description=(
            "The user's full mailing address, as it will appear on mailings and "
            "other official documents."
        ),
        resolver=lambda self, context: "\n".join(self.address_lines_for_mailing),
    )

    county = graphene.String(
        description="The county of the user's address, or null if we don't know.",
        resolver=lambda self, context: self.lookup_county(),
    )

    def resolve_is_in_los_angeles(self, info) -> Optional[bool]:
        if not self.zipcode:
            return None
        from norent.la_zipcodes import is_zip_code_in_la

        return is_zip_code_in_la(self.zipcode)

    def resolve_borough(self, info):
        if self.borough:
            return BOROUGH_CHOICES.get_enum_member(self.borough)
        return None

    def resolve_lease_type(self, info):
        if self.lease_type:
            return LEASE_CHOICES.get_enum_member(self.lease_type)
        return None


@schema_registry.register_session_info
class OnboardingSessionInfo(object):
    """
    A mixin class defining all onboarding-related queries.
    """

    onboarding_scaffolding = OnboardingScaffolding.graphql_field()

    onboarding_info = graphene.Field(
        OnboardingInfoType,
        description=(
            "The user's onboarding details, which they filled out "
            "during the onboarding process. This is not to be confused with "
            "the individual onboarding steps, which capture information "
            "someone filled out *during* onboarding, before they became "
            "a full-fledged user."
        ),
    )

    def resolve_onboarding_info(self, info: ResolveInfo) -> Optional[OnboardingInfo]:
        user = info.context.user
        if hasattr(user, "onboarding_info"):
            return user.onboarding_info
        return None
