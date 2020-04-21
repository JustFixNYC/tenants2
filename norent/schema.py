from typing import Optional, Dict, Any
import graphene
from graphql import ResolveInfo

from project import schema_registry
from project.util.session_mutation import SessionFormMutation
from project.schema_base import get_last_queried_phone_number
from onboarding.schema import OnboardingStep1Info, complete_onboarding
from onboarding.models import SIGNUP_INTENT_CHOICES
from . import scaffolding, forms


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

    def resolve_is_city_in_nyc(self, info: ResolveInfo) -> Optional[bool]:
        return self.is_city_in_nyc()


@schema_registry.register_session_info
class NorentSessionInfo(object):
    norent_scaffolding = graphene.Field(NorentScaffolding)

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


def are_all_truthy(*args) -> bool:
    for arg in args:
        if not arg:
            return False
    return True


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
