from typing import Optional, Dict, Any, Tuple
import datetime
import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
from django.utils.translation import gettext as _

from project import schema_registry
from project.util.session_mutation import SessionFormMutation
from project.util import site_util
from project import mapbox
from project.schema_base import get_last_queried_phone_number, purge_last_queried_phone_number
from onboarding.schema import OnboardingStep1Info, complete_onboarding
from onboarding.models import SIGNUP_INTENT_CHOICES
from loc.models import LandlordDetails
from . import scaffolding, forms, models, letter_sending


SCAFFOLDING_SESSION_KEY = f'norent_scaffolding_v{scaffolding.VERSION}'


class NorentScaffolding(graphene.ObjectType):
    '''
    Represents all fields of our scaffolding model.
    '''

    first_name = graphene.String(required=True)

    last_name = graphene.String(required=True)

    street = graphene.String(required=True)

    city = graphene.String(required=True)

    is_city_in_nyc = graphene.Boolean()

    is_in_los_angeles = graphene.Boolean(
        description=(
            "Whether the onboarding user is in Los Angeles. If "
            "we don't have enough information to tell, this will be null."
        )
    )

    state = graphene.String(required=True)

    zip_code = graphene.String(required=True)

    apt_number = graphene.String()

    email = graphene.String(required=True)

    phone_number = graphene.String(
        required=True,
        deprecation_reason="In lastQueriedPhoneNumber now")

    landlord_name = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    landlord_primary_line = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    landlord_city = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    landlord_state = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    landlord_zip_code = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    landlord_email = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    landlord_phone_number = graphene.String(
        required=True,
        deprecation_reason="In landlordDetails now")

    has_landlord_email_address = graphene.Boolean()

    has_landlord_mailing_address = graphene.Boolean()

    can_receive_rttc_comms = graphene.Boolean()

    def resolve_is_city_in_nyc(self, info: ResolveInfo) -> Optional[bool]:
        return self.is_city_in_nyc()

    def resolve_is_in_los_angeles(self, info: ResolveInfo) -> Optional[bool]:
        return self.is_zip_code_in_la()


class NorentLetter(DjangoObjectType):
    class Meta:
        model = models.Letter
        only_fields = ('tracking_number', 'letter_sent_at')

    payment_date = graphene.Date(
        required=True,
        description="The rent payment date the letter is for.",
        resolver=lambda self, info: self.latest_rent_period.payment_date
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

    norent_available_rent_periods = graphene.Field(
        graphene.List(NorentRentPeriod, required=True),
        description=(
            "A list of the available rent periods the current user can "
            "create a no rent letter for."
        ),
        deprecation_reason="We have yet to use this in the front-end; will un-deprecate once we start using it, to avoid needless schema migrations in case of change.",  # noqa
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
            "The number of no rent letters sent by the whole platform (not just " +
            "the current user)."
        )
    )

    norent_upcoming_letter_rent_periods = graphene.List(
        graphene.NonNull(graphene.types.Date), required=True,
        deprecation_reason="We have yet to use this in the front-end; will un-deprecate once we start using it, to avoid needless schema migrations in case of change.",  # noqa
    )

    def resolve_norent_latest_rent_period(self, info: ResolveInfo):
        return models.RentPeriod.objects.first()

    def resolve_norent_available_rent_periods(self, info: ResolveInfo):
        return list(models.RentPeriod.objects.all())

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
            for d in
            models.UpcomingLetterRentPeriod.objects.get_for_user(user)
        ]


def get_scaffolding(request) -> scaffolding.NorentScaffolding:
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    return scaffolding.NorentScaffolding(**scaffolding_dict)


def update_scaffolding(request, new_data):
    scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
    scaffolding_dict.update(new_data)
    request.session[SCAFFOLDING_SESSION_KEY] = scaffolding_dict


def purge_scaffolding(request):
    if SCAFFOLDING_SESSION_KEY in request.session:
        del request.session[SCAFFOLDING_SESSION_KEY]


class NorentScaffoldingMutation(SessionFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        update_scaffolding(request, form.cleaned_data)
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentFullName(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.FullName


@schema_registry.register_mutation
class NorentCityState(NorentScaffoldingMutation):
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
        cls,
        cleaned_data: Dict[str, str],
        city: str,
        state: str
    ) -> Tuple[Dict[str, str], Optional[bool]]:
        addresses = mapbox.find_address(
            address=cleaned_data['street'],
            city=city,
            state=state,
            zip_code=cleaned_data['zip_code']
        )
        if addresses is None:
            return (cleaned_data, None)
        if len(addresses) == 0:
            return (cleaned_data, False)
        address = addresses[0]
        return ({
            **cleaned_data,
            'street': address.address,
            'zip_code': address.zip_code,
        }, True)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        scf = get_scaffolding(request)
        city = scf.city
        state = scf.state
        if not (city and state):
            return cls.make_error("You haven't provided your city and state yet!")
        cleaned_data, is_valid = cls.validate_address(
            form.cleaned_data, city=city, state=state)
        update_scaffolding(request, cleaned_data)
        return cls.mutation_success(is_valid=is_valid)


@schema_registry.register_mutation
class NorentEmail(SessionFormMutation):
    class Meta:
        form_class = forms.Email

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        if user.is_authenticated:
            user.email = form.cleaned_data['email']
            user.is_email_verified = False
            user.save()
        else:
            update_scaffolding(request, form.cleaned_data)

        return cls.mutation_success()


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
        has_email_address = form.cleaned_data['has_email_address']
        has_mailing_address = form.cleaned_data['has_mailing_address']
        if not has_email_address:
            ld.email = ''
        if not has_mailing_address:
            ld.clear_address()
        ld.save()
        update_scaffolding(request, {
            'has_landlord_email_address': has_email_address,
            'has_landlord_mailing_address': has_mailing_address,
        })
        return cls.mutation_success()


def are_all_truthy(*args) -> bool:
    for arg in args:
        if not arg:
            return False
    return True


def does_user_have_ll_mailing_addr_or_email(user) -> bool:
    return (
        hasattr(user, 'landlord_details') and
        (user.landlord_details.address_lines_for_mailing or
         user.landlord_details.email)
    )


@schema_registry.register_mutation
class NorentSendLetter(SessionFormMutation):
    login_required = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        assert user.is_authenticated
        rent_period = models.RentPeriod.objects.first()
        if not rent_period:
            return cls.make_and_log_error(info, "No rent periods are defined!")
        letter = models.Letter.objects.filter(user=user, rent_periods=rent_period).first()
        if letter is not None:
            return cls.make_error("You have already sent a letter for this rent period!")
        if not hasattr(user, 'onboarding_info'):
            return cls.make_and_log_error(info, "You have not onboarded!")
        if not does_user_have_ll_mailing_addr_or_email(user):
            return cls.make_and_log_error(info, "You haven't provided any landlord details yet!")

        site_type = site_util.get_site_type(site_util.get_site_from_request_or_default(request))

        if site_type != site_util.SITE_CHOICES.NORENT:
            return cls.make_and_log_error(info, "This form can only be used from the NoRent site.")

        letter_sending.create_and_send_letter(request.user, rent_period)

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

        if not are_all_truthy(scf.street, scf.zip_code):
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
            'can_receive_rttc_comms': scf.can_receive_rttc_comms,
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
        allinfo['agreed_to_norent_terms'] = True
        user = complete_onboarding(request, info=allinfo, password=password)

        user.send_sms_async(
            _("Welcome to %(site_name)s, a product by JustFix.nyc. "
              "We'll be sending you notifications from this phone number.") % {
                  'site_name': site_util.get_site_name("NORENT")
            }
        )

        purge_last_queried_phone_number(request)
        OnboardingStep1Info.clear_from_request(request)
        purge_scaffolding(request)

        return cls.mutation_success()


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
            form.cleaned_data['rent_periods'],
        )
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentOptInToRttcComms(SessionFormMutation):
    class Meta:
        form_class = forms.OptInToRttcCommsForm

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        opt_in: bool = form.cleaned_data['opt_in']
        if user.is_authenticated:
            oi = request.user.onboarding_info
            oi.can_receive_rttc_comms = opt_in
            oi.save()
        else:
            update_scaffolding(request, {
                'can_receive_rttc_comms': opt_in
            })
        return cls.mutation_success()
