import graphene
from graphene_django.types import DjangoObjectType
from graphql import ResolveInfo

from project import schema_registry
from project.util.session_mutation import SessionFormMutation
from . import scaffolding, forms
from .models import NationalOnboardingInfo


SCAFFOLDING_SESSION_KEY = f'norent_scaffolding_v{scaffolding.VERSION}'


class NorentScaffolding(graphene.ObjectType):
    '''
    Represents all fields of our scaffolding model.
    '''

    first_name = graphene.String(required=True)

    last_name = graphene.String(required=True)

    street = graphene.String(required=True)

    city = graphene.String(required=True)

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


class NationalOnboardingInfoType(DjangoObjectType):
    class Meta:
        model = NationalOnboardingInfo
        only_fields = (
            'address', 'apt_number', 'city', 'state', 'zip_code',)

    # Make the 'state' field just a string, not an enum, for now.
    state = graphene.String(
        required=True,
        description=NationalOnboardingInfo._meta.get_field('state').help_text,
    )


@schema_registry.register_session_info
class NorentSessionInfo(object):
    norent_scaffolding = graphene.Field(NorentScaffolding)

    national_onboarding_info = graphene.Field(
        NationalOnboardingInfoType,
        description=(
            "The user's non-NYC onboarding details. This will only be "
            "non-null if the user is both logged-in *and* their address "
            "is not in New York City."
        ),
    )

    def resolve_norent_scaffolding(self, info: ResolveInfo):
        request = info.context
        kwargs = request.session.get(SCAFFOLDING_SESSION_KEY, {})
        if kwargs:
            return scaffolding.NorentScaffolding(**kwargs)
        return None

    def resolve_national_onboarding_info(self, info: ResolveInfo):
        user = info.context.user
        if hasattr(user, 'national_onboarding_info'):
            return user.national_onboarding_info
        return None


class NorentScaffoldingMutation(SessionFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        scaffolding_dict = request.session.get(SCAFFOLDING_SESSION_KEY, {})
        scaffolding_dict.update(form.cleaned_data)
        request.session[SCAFFOLDING_SESSION_KEY] = scaffolding_dict
        return cls.mutation_success()


@schema_registry.register_mutation
class NorentTenantInfo(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.TenantInfo


@schema_registry.register_mutation
class NorentLandlordInfo(NorentScaffoldingMutation):
    class Meta:
        form_class = forms.LandlordInfo
