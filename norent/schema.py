from project.util.mailing_address import US_STATE_CHOICES, is_zip_code_valid_for_state
from typing import Optional, Dict, Any, Tuple
import datetime

from django.http.request import HttpRequest
from django.conf import settings
from users.models import JustfixUser
import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
from django.utils.translation import gettext as _

from project import schema_registry
from project.util.session_mutation import SessionFormMutation
from project.util import site_util
from project import mapbox
from project.schema_base import get_last_queried_phone_number, purge_last_queried_phone_number
from onboarding.schema import complete_onboarding
from onboarding.schema_util import mutation_requires_onboarding
from onboarding.models import SIGNUP_INTENT_CHOICES
from onboarding.scaffolding import (
    OnboardingScaffolding,
    OnboardingScaffoldingMutation,
    OnboardingScaffoldingOrUserDataMutation,
    get_scaffolding,
    update_scaffolding,
    purge_scaffolding,
)
from findhelp.models import is_lnglat_in_nyc
from loc.models import LandlordDetails
from . import forms, models, letter_sending


class NorentLetter(DjangoObjectType):
    class Meta:
        model = models.Letter
        only_fields = ("tracking_number", "letter_sent_at", "created_at")

    payment_date = graphene.Date(
        required=True,
        description="The rent payment date the letter is for.",
        deprecation_reason="No longer used by front-end code since we started supporting multiple rent periods per letter.",  # noqa
        resolver=lambda self, info: self.latest_rent_period.payment_date,
    )


class NorentRentPeriod(DjangoObjectType):
    class Meta:
        model = models.RentPeriod
        only_fields = ("payment_date",)


@schema_registry.register_session_info
class NorentSessionInfo(object):
    norent_latest_rent_period = graphene.Field(
        NorentRentPeriod,
        deprecation_reason="No longer used by front-end code.",
        description="The latest rent period one can create a no rent letter for.",
    )

    norent_available_rent_periods = graphene.Field(
        graphene.NonNull(graphene.List(graphene.NonNull(NorentRentPeriod), required=True)),
        description=(
            "A list of the available rent periods the current user can "
            "create a no rent letter for."
        ),
    )

    norent_latest_letter = graphene.Field(
        NorentLetter,
        description=(
            "The latest no rent letter sent by the user. If the user has never "
            "sent a letter or is not logged in, this will be null."
        ),
    )

    norent_letters_sent = graphene.Int(
        required=True,
        description=(
            "The number of no rent letters sent by the whole platform (not just "
            + "the current user)."
        ),
    )

    norent_upcoming_letter_rent_periods = graphene.List(
        graphene.NonNull(graphene.types.Date),
        required=True,
        description=(
            "The rent periods that the user's upcoming no rent letter " "are in regards to."
        ),
    )

    def resolve_norent_latest_rent_period(self, info: ResolveInfo):
        return models.RentPeriod.objects.first()

    def resolve_norent_available_rent_periods(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return list(models.RentPeriod.objects.get_available_for_user(user))

    def resolve_norent_latest_letter(self, info: ResolveInfo):
        request = info.context
        if not request.user.is_authenticated:
            return None
        return models.Letter.objects.filter(user=request.user).first()

    def resolve_norent_letters_sent(self, info: ResolveInfo):
        # Note that Postgres' count() is not very efficient, as it
        # generally needs to perform a sequential scan, so we might
        # want to cache this at some point.
        return models.Letter.objects.all().count()

    def resolve_norent_upcoming_letter_rent_periods(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return [
            datetime.date.fromisoformat(d)
            for d in models.UpcomingLetterRentPeriod.objects.get_for_user(user)
        ]


@schema_registry.register_mutation
class NorentFullName(OnboardingScaffoldingOrUserDataMutation):
    class Meta:
        form_class = forms.FullLegalName

    deprecation_reason = "Use NorentFullLegalName instead."

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        user = info.context.user
        user.first_name = form.cleaned_data["first_name"]
        user.last_name = form.cleaned_data["last_name"]
        user.save()
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentFullLegalName(OnboardingScaffoldingOrUserDataMutation):
    class Meta:
        form_class = forms.FullLegalName

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        user = info.context.user
        user.first_name = form.cleaned_data["first_name"]
        user.last_name = form.cleaned_data["last_name"]
        user.save()
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentFullLegalAndPreferredName(OnboardingScaffoldingOrUserDataMutation):
    class Meta:
        form_class = forms.FullLegalAndPreferredName

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        user = info.context.user
        user.first_name = form.cleaned_data["first_name"]
        user.last_name = form.cleaned_data["last_name"]
        user.preferred_first_name = form.cleaned_data["preferred_first_name"]
        user.save()
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentPreferredName(OnboardingScaffoldingOrUserDataMutation):
    class Meta:
        form_class = forms.PreferredName

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        user = info.context.user
        user.preferred_first_name = form.cleaned_data["preferred_first_name"]
        user.save()
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentCityState(OnboardingScaffoldingMutation):
    class Meta:
        form_class = forms.CityState


@schema_registry.register_mutation
class NorentNationalAddress(SessionFormMutation):
    class Meta:
        form_class = forms.NationalAddress

    is_valid = graphene.Boolean(
        description=(
            "Whether or not the provided address appears to be valid. "
            "If Mapbox integration is disabled, there was a problem contacting Mapbox, "
            "or the mutation was unsuccessful, this will be null."
        )
    )

    @classmethod
    def validate_address(
        cls, cleaned_data: Dict[str, str], city: str, state: str
    ) -> Tuple[Dict[str, Any], Optional[bool]]:
        addresses = mapbox.find_address(
            address=cleaned_data["street"],
            city=city,
            state=state,
            zip_code=cleaned_data["zip_code"],
        )
        if addresses is None:
            return (cleaned_data, None)
        if len(addresses) == 0:
            return (cleaned_data, False)
        address = addresses[0]
        return (
            {
                **cleaned_data,
                "street": address.address,
                "zip_code": address.zip_code,
                "lnglat": tuple(address.geometry.coordinates),
            },
            True,
        )

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        scf = get_scaffolding(request)
        city = scf.city
        state = scf.state
        if not (city and state):
            return cls.make_error("You haven't provided your city and state yet!")
        cleaned_data, is_valid = cls.validate_address(form.cleaned_data, city=city, state=state)
        if not is_zip_code_valid_for_state(cleaned_data["zip_code"], state):
            return cls.make_error(
                _("Please enter a valid ZIP code for %(state_name)s.")
                % {"state_name": US_STATE_CHOICES.get_label(state)},
                field="zip_code",
            )
        if is_valid and is_lnglat_in_nyc(cleaned_data["lnglat"]):
            return cls.make_error(
                _(
                    "Your address appears to be within New York City. Please "
                    'go back and enter "New York City" as your city.'
                ),
                code="ADDRESS_IS_IN_NYC",
            )
        update_scaffolding(request, cleaned_data)
        return cls.mutation_success(is_valid=is_valid)


class BaseNorentEmail(OnboardingScaffoldingOrUserDataMutation):
    class Meta:
        abstract = True

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        user = info.context.user
        new_email = form.cleaned_data["email"]
        if new_email != user.email:
            user.email = new_email
            user.is_email_verified = False
            user.save()
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentEmail(BaseNorentEmail):
    class Meta:
        form_class = forms.Email


@schema_registry.register_mutation
class NorentOptionalEmail(BaseNorentEmail):
    class Meta:
        form_class = forms.OptionalEmail


@schema_registry.register_mutation
class NorentLandlordNameAndContactTypes(SessionFormMutation):
    class Meta:
        form_class = forms.LandlordNameAndContactTypes

    login_required = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        ld = LandlordDetails.objects.get_or_create(user=user)[0]
        ld.name = form.cleaned_data["name"]
        ld.is_looked_up = False
        has_email_address = form.cleaned_data["has_email_address"]
        has_mailing_address = form.cleaned_data["has_mailing_address"]
        if not has_email_address:
            ld.email = ""
        if not has_mailing_address:
            ld.clear_address()
        ld.save()
        update_scaffolding(
            request,
            {
                "has_landlord_email_address": has_email_address,
                "has_landlord_mailing_address": has_mailing_address,
            },
        )
        return cls.mutation_success()


def are_all_truthy(*args) -> bool:
    for arg in args:
        if not arg:
            return False
    return True


def does_user_have_ll_mailing_addr_or_email(user) -> bool:
    return hasattr(user, "landlord_details") and (
        user.landlord_details.address_lines_for_mailing or user.landlord_details.email
    )


@schema_registry.register_mutation
class NorentSendLetterV2(SessionFormMutation):
    """
    Send the user's no rent letter, setting the letter's rent periods
    to the upcoming ones that the user has previously chosen.
    """

    login_required = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        # If NoRent is deprecated, reject this request and tell the user to reload their browser,
        # so that they'll be given more details on why the tool was discontinued.
        if settings.IS_NORENT_DEPRECATED:
            return cls.make_error(
                _("This tool has been deprecated! Please reload the page for more details.")
            )

        request = info.context
        user = request.user
        assert user.is_authenticated
        rent_periods = models.UpcomingLetterRentPeriod.objects.get_rent_periods_for_user(user)
        if len(rent_periods) == 0:
            return cls.make_error("You have not chosen any rent periods!")
        letter = models.Letter.objects.filter(user=user, rent_periods__in=rent_periods).first()
        if letter is not None:
            return cls.make_error("You have already sent a letter for one of the rent periods!")
        if not does_user_have_ll_mailing_addr_or_email(user):
            return cls.make_and_log_error(info, "You haven't provided any landlord details yet!")

        site_type = site_util.get_site_type(site_util.get_site_from_request_or_default(request))

        if site_type != site_util.SITE_CHOICES.NORENT:
            return cls.make_and_log_error(info, "This form can only be used from the NoRent site.")

        letter_sending.create_and_send_letter(request.user, rent_periods)
        models.UpcomingLetterRentPeriod.objects.clear_for_user(user)

        return cls.mutation_success()


class BaseCreateAccount(SessionFormMutation):
    class Meta:
        abstract = True

    require_email = True

    signup_intent: str = ""

    @classmethod
    def fill_city_info(cls, request, info: Dict[str, Any], scf: OnboardingScaffolding):
        info = {
            **info,
            "address": scf.street,
            "apt_number": scf.apt_number,
            "address_verified": scf.address_verified,
        }

        if scf.is_city_in_nyc():
            if scf.borough:
                info["borough"] = scf.borough
            else:
                return None
        else:
            if not are_all_truthy(scf.street, scf.zip_code):
                return None
            info["non_nyc_city"] = scf.city
            info["zipcode"] = scf.zip_code
        return info

    @classmethod
    def get_previous_step_info(cls, request) -> Optional[Dict[str, Any]]:
        scf = get_scaffolding(request)
        phone_number = get_last_queried_phone_number(request)
        if cls.require_email and not scf.email:
            return None
        if not are_all_truthy(phone_number, scf.first_name, scf.last_name, scf.city, scf.state):
            return None
        assert cls.signup_intent, "signup_intent must be set on class!"
        info: Dict[str, Any] = {
            "phone_number": phone_number,
            "first_name": scf.first_name,
            "last_name": scf.last_name,
            "preferred_first_name": scf.preferred_first_name,
            "state": scf.state,
            "email": scf.email,
            "signup_intent": cls.signup_intent,
            "can_receive_rttc_comms": scf.can_receive_rttc_comms,
            "can_receive_saje_comms": scf.can_receive_saje_comms,
        }
        return cls.fill_city_info(request, info, scf)

    @classmethod
    def update_onboarding_info(cls, form, info: Dict[str, Any]):
        pass

    @classmethod
    def perform_post_onboarding(cls, form, request: HttpRequest, user: JustfixUser):
        pass

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        password = form.cleaned_data["password"]
        allinfo = cls.get_previous_step_info(request)
        if allinfo is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        allinfo.update(form.cleaned_data)
        cls.update_onboarding_info(form, allinfo)
        user = complete_onboarding(request, info=allinfo, password=password)
        cls.perform_post_onboarding(form, request, user)

        purge_last_queried_phone_number(request)
        purge_scaffolding(request)

        return cls.mutation_success()


@schema_registry.register_mutation
class NorentCreateAccount(BaseCreateAccount):
    class Meta:
        form_class = forms.CreateAccount

    signup_intent = SIGNUP_INTENT_CHOICES.NORENT

    @classmethod
    def update_onboarding_info(cls, form, info: Dict[str, Any]):
        info["agreed_to_norent_terms"] = True

    @classmethod
    def perform_post_onboarding(cls, form, request: HttpRequest, user: JustfixUser):
        user.send_sms_async(
            _(
                "Welcome to %(site_name)s, a product by JustFix. "
                "We'll be sending you notifications from this phone number."
            )
            % {"site_name": site_util.get_site_name("NORENT")}
        )


@schema_registry.register_mutation
class NorentSetUpcomingLetterRentPeriods(SessionFormMutation):
    class Meta:
        form_class = forms.RentPeriodsForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        models.UpcomingLetterRentPeriod.objects.set_for_user(
            request.user,
            form.cleaned_data["rent_periods"],
        )
        return cls.mutation_success()


class NorentOptInToComms(OnboardingScaffoldingOrUserDataMutation):
    """
    Abstract base class to make it easy to opt-in to
    communications from a partner organization.
    """

    class Meta:
        # This needs to be added to all base classes; we
        # can't add it here, because this class' metaclass
        # is super weird.
        #
        # form_class = forms.OptInToCommsForm

        abstract = True

    # This needs to be set to a nullable boolean field of both
    # OnboardingInfo and OnboardingScaffolding.
    comms_field_name = ""

    @classmethod
    def get_opt_in(cls, form) -> bool:
        assert cls.comms_field_name
        return form.cleaned_data["opt_in"]

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        oi = user.onboarding_info
        setattr(oi, cls.comms_field_name, cls.get_opt_in(form))
        oi.save()
        return cls.mutation_success()

    @classmethod
    def perform_mutate_for_anonymous_user(cls, form, info: ResolveInfo):
        update_scaffolding(info.context, {cls.comms_field_name: cls.get_opt_in(form)})
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentOptInToRttcComms(NorentOptInToComms):
    class Meta:
        form_class = forms.OptInToCommsForm

    comms_field_name = "can_receive_rttc_comms"


@schema_registry.register_mutation
class NorentOptInToSajeComms(NorentOptInToComms):
    class Meta:
        form_class = forms.OptInToCommsForm

    comms_field_name = "can_receive_saje_comms"
