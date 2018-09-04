from typing import Optional
import graphene
from graphql import ResolveInfo
from django.contrib.auth import logout, login
from django.middleware import csrf
from graphene_django.forms.mutation import fields_for_form

from project.util.django_graphql_forms import DjangoFormMutation
from . import forms


ONBOARDING_STEP_1_SESSION_KEY = 'onboarding_step_1'

ONBOARDING_STEP_2_SESSION_KEY = 'onboarding_step_2'

ONBOARDING_STEP_3_SESSION_KEY = 'onboarding_step_3'


class OnboardingStep1Info(graphene.ObjectType):
    locals().update(fields_for_form(forms.OnboardingStep1Form(), [], []))

    address_verified = graphene.Boolean(
        required=True,
        description=(
            "Whether the user's address was verified by a geocoder. "
            "If False, it is because the geocoder service was unavailable, "
            "not because the address is invalid."
        )
    )


class OnboardingStep2Info(graphene.ObjectType):
    locals().update(fields_for_form(forms.OnboardingStep2Form(), [], []))


class OnboardingStep3Info(graphene.ObjectType):
    locals().update(fields_for_form(forms.OnboardingStep3Form(), [], []))


class SessionInfo(graphene.ObjectType):
    phone_number = graphene.String(
        description=(
            "The phone number of the currently logged-in user, or "
            "null if not logged-in."
        )
    )

    csrf_token = graphene.String(
        description="The cross-site request forgery (CSRF) token.",
        required=True
    )

    is_staff = graphene.Boolean(
        description="Whether or not the currently logged-in user is a staff member.",
        required=True
    )

    onboarding_step_1 = graphene.Field(OnboardingStep1Info)

    onboarding_step_2 = graphene.Field(OnboardingStep2Info)

    onboarding_step_3 = graphene.Field(OnboardingStep3Info)

    def resolve_phone_number(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return request.user.phone_number

    def resolve_csrf_token(self, info: ResolveInfo) -> str:
        request = info.context
        return csrf.get_token(request)

    def resolve_is_staff(self, info: ResolveInfo) -> bool:
        return info.context.user.is_staff

    def resolve_onboarding_step_1(self, info: ResolveInfo) -> Optional[OnboardingStep1Info]:
        request = info.context
        obinfo = request.session.get(ONBOARDING_STEP_1_SESSION_KEY)
        return OnboardingStep1Info(**obinfo) if obinfo else None

    def resolve_onboarding_step_2(self, info: ResolveInfo) -> Optional[OnboardingStep2Info]:
        request = info.context
        obinfo = request.session.get(ONBOARDING_STEP_2_SESSION_KEY)
        return OnboardingStep2Info(**obinfo) if obinfo else None

    def resolve_onboarding_step_3(self, info: ResolveInfo) -> Optional[OnboardingStep3Info]:
        request = info.context
        obinfo = request.session.get(ONBOARDING_STEP_3_SESSION_KEY)
        return OnboardingStep3Info(**obinfo) if obinfo else None


class OnboardingStep1(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep1Form

    session = graphene.Field(SessionInfo)

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep1Form, info: ResolveInfo):
        request = info.context
        request.session[ONBOARDING_STEP_1_SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=SessionInfo())


class OnboardingStep2(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep2Form

    session = graphene.Field(SessionInfo)

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep2Form, info: ResolveInfo):
        request = info.context
        request.session[ONBOARDING_STEP_2_SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=SessionInfo())


class OnboardingStep3(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep3Form

    session = graphene.Field(SessionInfo)

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep3Form, info: ResolveInfo):
        request = info.context
        request.session[ONBOARDING_STEP_3_SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=SessionInfo())


class Login(DjangoFormMutation):
    '''
    A mutation to log in the user. Returns whether or not the login was successful
    (if it wasn't, it's because the credentials were invalid). It also returns
    a new CSRF token, because as the Django docs state, "For security reasons,
    CSRF tokens are rotated each time a user logs in":

        https://docs.djangoproject.com/en/2.1/ref/csrf/
    '''

    class Meta:
        form_class = forms.LoginForm

    session = graphene.Field(SessionInfo)

    @classmethod
    def perform_mutate(cls, form: forms.LoginForm, info: ResolveInfo):
        request = info.context
        login(request, form.authenticated_user)
        return cls(errors=[], session=SessionInfo())


class Logout(graphene.Mutation):
    '''
    Logs out the user. Clients should pay attention to the
    CSRF token, because apparently this changes on logout too.
    '''

    session = graphene.NonNull(SessionInfo)

    def mutate(self, info: ResolveInfo) -> 'Logout':
        request = info.context
        logout(request)
        return Logout(session=SessionInfo())


class Mutations(graphene.ObjectType):
    logout = Logout.Field(required=True)
    login = Login.Field(required=True)
    onboarding_step_1 = OnboardingStep1.Field(required=True)
    onboarding_step_2 = OnboardingStep2.Field(required=True)
    onboarding_step_3 = OnboardingStep3.Field(required=True)


class Query(graphene.ObjectType):
    '''
    Here is some help text that gets passed back to
    GraphQL clients as part of our schema.
    '''

    session = graphene.NonNull(SessionInfo)

    def resolve_session(self, info: ResolveInfo) -> SessionInfo:
        return SessionInfo()


schema = graphene.Schema(query=Query, mutation=Mutations)
