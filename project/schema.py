from typing import Optional
import graphene
from graphql import ResolveInfo
from django.contrib.auth import logout, login
from django.middleware import csrf

from project.util.django_graphql_forms import DjangoFormMutation
from onboarding.schema import OnboardingMutations, OnboardingSessionInfo
from issues.schema import IssueMutations, IssueSessionInfo
from . import forms


class SessionInfo(OnboardingSessionInfo, IssueSessionInfo, graphene.ObjectType):
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


class Mutations(OnboardingMutations, IssueMutations, graphene.ObjectType):
    logout = Logout.Field(required=True)
    login = Login.Field(required=True)


class Query(graphene.ObjectType):
    '''
    Here is some help text that gets passed back to
    GraphQL clients as part of our schema.
    '''

    session = graphene.NonNull(SessionInfo)

    def resolve_session(self, info: ResolveInfo) -> SessionInfo:
        return SessionInfo()


schema = graphene.Schema(query=Query, mutation=Mutations)
