from typing import Optional, Dict, Any
import logging
import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
from django.urls import reverse
from django.utils import timezone

from project import schema_registry
from project.util.session_mutation import SessionFormMutation
from project.util import site_util
from project.schema_base import get_last_queried_phone_number
from onboarding.schema import OnboardingStep1Info, complete_onboarding
from onboarding.models import SIGNUP_INTENT_CHOICES
from loc.models import LandlordDetails
from . import scaffolding, forms, models


SCAFFOLDING_SESSION_KEY = f'norent_scaffolding_v{scaffolding.VERSION}'

logger = logging.getLogger(__name__)


class NorentScaffolding(graphene.ObjectType):
    '''
    Represents all fields of our scaffolding model.
    '''

    first_name = graphene.String(required=True)

    last_name = graphene.String(required=True)

    street = graphene.String(required=True)

    city = graphene.String(required=True)

    is_city_in_nyc = graphene.Boolean()

    state = graphene.String(required=True)

    zip_code = graphene.String(required=True)

    apt_number = graphene.String(required=True)

    email = graphene.String(required=True)

    phone_number = graphene.String(required=True)

    landlord_name = graphene.String(required=True)

    landlord_primary_line = graphene.String(required=True)

    landlord_city = graphene.String(required=True)

    landlord_state = graphene.String(required=True)

    landlord_zip_code = graphene.String(required=True)

    landlord_email = graphene.String(required=True)

    landlord_phone_number = graphene.String(required=True)

    has_landlord_email_address = graphene.Boolean()

    has_landlord_mailing_address = graphene.Boolean()

    def resolve_is_city_in_nyc(self, info: ResolveInfo) -> Optional[bool]:
        return self.is_city_in_nyc()


class NorentLetter(DjangoObjectType):
    class Meta:
        model = models.Letter
        only_fields = ('tracking_number', 'letter_sent_at')

    payment_date = graphene.Date(
        required=True,
        description="The rent payment date the letter is for.",
        resolver=lambda self, info: self.rent_period.payment_date
    )


class NorentRentPeriod(DjangoObjectType):
    class Meta:
        model = models.RentPeriod
        only_fields = ('payment_date',)


@schema_registry.register_session_info
class NorentSessionInfo(object):
    norent_scaffolding = graphene.Field(NorentScaffolding)

    norent_latest_rent_period = graphene.Field(
        NorentRentPeriod,
        description="The latest rent period one can create a no rent letter for.")

    norent_latest_letter = graphene.Field(
        NorentLetter,
        description=(
            "The latest no rent letter sent by the user. If the user has never "
            "sent a letter or is not logged in, this will be null."
        ),
    )

    def resolve_norent_latest_rent_period(self, info: ResolveInfo):
        return models.RentPeriod.objects.first()

    def resolve_norent_latest_letter(self, info: ResolveInfo):
        request = info.context
        if not request.user.is_authenticated:
            return None
        return models.Letter.objects.filter(user=request.user).first()

    def resolve_norent_scaffolding(self, info: ResolveInfo):
        request = info.context
        kwargs = request.session.get(SCAFFOLDING_SESSION_KEY, {})
        if kwargs:
            return scaffolding.NorentScaffolding(**kwargs)
        return None


def get_scaffolding(request) -> scaffolding.NorentScaffolding:
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    return scaffolding.NorentScaffolding(**scaffolding_dict)


def update_scaffolding(request, new_data):
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    scaffolding_dict.update(new_data)
    request.session[SCAFFOLDING_SESSION_KEY] = scaffolding_dict


class NorentScaffoldingMutation(SessionFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        update_scaffolding(request, form.cleaned_data)
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentLandlordInfo(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.LandlordInfo


@schema_registry.register_mutation
class NorentFullName(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.FullName


@schema_registry.register_mutation
class NorentCityState(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.CityState


@schema_registry.register_mutation
class NorentNationalAddress(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.NationalAddress


@schema_registry.register_mutation
class NorentEmail(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.Email


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
        ld.name = form.cleaned_data['name']
        ld.is_looked_up = False
        ld.save()
        update_scaffolding(request, {
            'has_landlord_email_address': form.cleaned_data['has_email_address'],
            'has_landlord_mailing_address': form.cleaned_data['has_mailing_address'],
        })
        return cls.mutation_success()


def are_all_truthy(*args) -> bool:
    for arg in args:
        if not arg:
            return False
    return True


def scaffolding_to_landlord_details(request):
    scf = get_scaffolding(request)
    if not scf.landlord_name:
        return None
    details = LandlordDetails(
        name=scf.landlord_name,
        email=scf.landlord_email,
        primary_line=scf.landlord_primary_line,
        city=scf.landlord_city,
        state=scf.landlord_state,
        zip_code=scf.landlord_zip_code,
    )
    details.address = '\n'.join(details.address_lines_for_mailing)
    return details


@schema_registry.register_mutation
class NorentSendLetter(SessionFormMutation):
    login_required = True

    @classmethod
    def send_letter(cls, request, ld: LandlordDetails, rp: models.RentPeriod):
        from io import BytesIO
        from loc import lob_api
        from project.views import render_raw_lambda_static_content
        from loc.views import render_pdf_bytes

        user = request.user

        # TODO: Once we translate to other languages, we'll likely want to
        # force the locale of this letter to English, since that's what the
        # landlord will read the letter as.
        lr = render_raw_lambda_static_content(
            request,
            url=f"{reverse('react')}letter.pdf"
        )
        assert lr is not None, "Rendering of PDF HTML must succeed"
        assert lr.http_headers['Content-Type'] == "application/pdf"
        letter = models.Letter(
            user=user,
            rent_period=rp,
            html_content=lr.html,
        )
        letter.full_clean()
        letter.save()

        pdf_bytes = render_pdf_bytes(letter.html_content)

        if ld.email:
            # TODO: Send letter via email.
            pass

        if ld.primary_line:
            ll_addr_details = ld.get_or_create_address_details_model()
            landlord_verification = lob_api.verify_address(**ll_addr_details.as_lob_params())
            user_verification = lob_api.verify_address(**user.onboarding_info.as_lob_params())

            logger.info(
                f"Sending {letter} with {landlord_verification['deliverability']} "
                f"landlord address."
            )

            response = lob_api.mail_certified_letter(
                description="No rent letter",
                to_address={
                    'name': ld.name,
                    **lob_api.verification_to_inline_address(landlord_verification),
                },
                from_address={
                    'name': user.full_name,
                    **lob_api.verification_to_inline_address(user_verification),
                },
                file=BytesIO(pdf_bytes),
                color=False,
                double_sided=False,
            )
            letter.lob_letter_object = response
            letter.tracking_number = response['tracking_number']
            letter.letter_sent_at = timezone.now()
            letter.save()

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        assert user.is_authenticated
        rent_period = models.RentPeriod.objects.first()
        if not rent_period:
            return cls.make_and_log_error(info, "No rent periods are defined!")
        letter = models.Letter.objects.filter(user=user, rent_period=rent_period).first()
        if letter is not None:
            return cls.make_error("You have already sent a letter for this rent period!")
        if not hasattr(user, 'onboarding_info'):
            return cls.make_and_log_error(info, "You have not onboarded!")

        ld = scaffolding_to_landlord_details(request)

        if not ld:
            return cls.make_and_log_error(info, "You haven't provided any landlord details yet!")

        site_type = site_util.get_site_type(site_util.get_site_from_request_or_default(request))

        if site_type != site_util.SITE_CHOICES.NORENT:
            return cls.make_and_log_error(info, "This form can only be used from the NoRent site.")

        cls.send_letter(request, ld, rent_period)

        return cls.mutation_success()


@schema_registry.register_mutation
class NorentCreateAccount(SessionFormMutation):
    class Meta:
        form_class = forms.CreateAccount

    @classmethod
    def fill_nyc_info(cls, request, info: Dict[str, Any]):
        step1 = OnboardingStep1Info.get_dict_from_request(request)
        if step1 is None:
            return None
        info['borough'] = step1['borough']
        info['address'] = step1['address']
        info['apt_number'] = step1['apt_number']
        info['address_verified'] = step1['address_verified']
        return info

    @classmethod
    def fill_city_info(cls, request, info: Dict[str, Any], scf: scaffolding.NorentScaffolding):
        if scf.is_city_in_nyc():
            return cls.fill_nyc_info(request, info)

        if not are_all_truthy(scf.street, scf.zip_code, scf.apt_number):
            return None
        info['non_nyc_city'] = scf.city
        info['address'] = scf.street
        info['apt_number'] = scf.apt_number
        info['zipcode'] = scf.zip_code
        info['address_verified'] = False
        return info

    @classmethod
    def get_previous_step_info(cls, request) -> Optional[Dict[str, Any]]:
        scf = get_scaffolding(request)
        phone_number = get_last_queried_phone_number(request)
        if not are_all_truthy(
            phone_number, scf.first_name, scf.last_name, scf.city,
            scf.state, scf.email
        ):
            return None
        info: Dict[str, Any] = {
            'phone_number': phone_number,
            'first_name': scf.first_name,
            'last_name': scf.last_name,
            'state': scf.state,
            'email': scf.email,
            'signup_intent': SIGNUP_INTENT_CHOICES.NORENT,
        }
        return cls.fill_city_info(request, info, scf)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        password = form.cleaned_data['password']
        allinfo = cls.get_previous_step_info(request)
        if allinfo is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        allinfo.update(form.cleaned_data)
        complete_onboarding(request, info=allinfo, password=password)

        # TODO: Remove data from session.

        return cls.mutation_success()
