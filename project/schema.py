from typing import Optional
import graphene
from graphql import ResolveInfo
from django.contrib.auth import logout, login
from django.middleware import csrf
from django.forms import formset_factory

from project.util.django_graphql_forms import DjangoFormMutation
from onboarding.schema import OnboardingMutations, OnboardingSessionInfo
from issues.schema import IssueMutations, IssueSessionInfo
from loc.schema import LocMutations, LocSessionInfo
from hpaction.schema import HPActionMutations, HPActionSessionInfo
from legacy_tenants.schema import LegacyUserSessionInfo
from frontend import safe_mode
from findhelp.schema import FindhelpInfo
from . import forms, password_reset


class SessionInfo(
    LegacyUserSessionInfo,
    HPActionSessionInfo,
    LocSessionInfo,
    OnboardingSessionInfo,
    IssueSessionInfo,
    graphene.ObjectType
):
    first_name = graphene.String(
        description=(
            "The first name of the currently logged-in user, or "
            "null if not logged-in."
        )
    )

    last_name = graphene.String(
        description=(
            "The last name of the currently logged-in user, or "
            "null if not logged-in."
        )
    )

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

    is_safe_mode_enabled = graphene.Boolean(
        description=(
            "Whether or not the current session has safe/compatibility mode "
            "compatibility mode) enabled."
        ),
        required=True
    )

    def resolve_first_name(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return request.user.first_name

    def resolve_last_name(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return request.user.last_name

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

    def resolve_is_safe_mode_enabled(self, info: ResolveInfo) -> bool:
        return safe_mode.is_enabled(info.context)


class Example(DjangoFormMutation):
    class Meta:
        form_class = forms.ExampleForm
        formset_classes = {
            'subforms': formset_factory(
                forms.ExampleSubform,
                max_num=5,
                validate_max=True,
                formset=forms.ExampleSubformFormset
            )
        }

    response = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        base_form: forms.LoginForm = form.base_form
        return cls(response=f"hello there {base_form.cleaned_data['example_field']}")


class ExampleRadio(DjangoFormMutation):
    class Meta:
        form_class = forms.ExampleRadioForm

    response = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        return cls(response='whatever')


class ExampleQuery(graphene.ObjectType):
    hello = graphene.String(argument=graphene.String(default_value="stranger"))

    def resolve_hello(self, info: ResolveInfo, argument: str) -> str:
        return f"Hello {argument}"


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


class Logout(DjangoFormMutation):
    '''
    Logs out the user. Clients should pay attention to the
    CSRF token, because apparently this changes on logout too.
    '''

    class Meta:
        form_class = forms.LogoutForm

    session = graphene.NonNull(SessionInfo)

    @classmethod
    def perform_mutate(cls, form: forms.LogoutForm, info: ResolveInfo):
        request = info.context
        logout(request)
        return Logout(session=SessionInfo())


class PasswordReset(DjangoFormMutation):
    '''
    Used when the user requests their password be reset.
    '''

    class Meta:
        form_class = forms.PasswordResetForm

    @classmethod
    def perform_mutate(cls, form: forms.PasswordResetForm, info: ResolveInfo):
        request = info.context
        password_reset.create_verification_code(request, form.cleaned_data['phone_number'])
        return cls(errors=[])


class PasswordResetVerificationCode(DjangoFormMutation):
    '''
    Used when the user verifies the verification code sent to them over SMS.
    '''

    class Meta:
        form_class = forms.PasswordResetVerificationCodeForm

    @classmethod
    def perform_mutate(cls, form: forms.PasswordResetVerificationCodeForm, info: ResolveInfo):
        request = info.context
        err_str = password_reset.verify_verification_code(
            request, form.cleaned_data['code'])
        if err_str is not None:
            return cls.make_error(err_str)
        return cls(errors=[])


class PasswordResetConfirm(DjangoFormMutation):
    '''
    Used when the user completes the password reset process
    by providing a new password.
    '''

    class Meta:
        form_class = forms.SetPasswordForm

    @classmethod
    def perform_mutate(cls, form: forms.SetPasswordForm, info: ResolveInfo):
        request = info.context
        err_str = password_reset.set_password(request, form.cleaned_data['password'])
        if err_str is not None:
            return cls.make_error(err_str)
        return cls(errors=[])


class Mutations(
    HPActionMutations,
    LocMutations,
    OnboardingMutations,
    IssueMutations,
    graphene.ObjectType
):
    logout = Logout.Field(required=True)
    login = Login.Field(required=True)
    password_reset = PasswordReset.Field(required=True)
    password_reset_verification_code = PasswordResetVerificationCode.Field(required=True)
    password_reset_confirm = PasswordResetConfirm.Field(required=True)
    example = Example.Field(required=True)
    example_radio = ExampleRadio.Field(required=True)


class Query(FindhelpInfo, graphene.ObjectType):
    '''
    Here is some help text that gets passed back to
    GraphQL clients as part of our schema.
    '''

    session = graphene.NonNull(SessionInfo)

    example_query = graphene.NonNull(ExampleQuery)

    def resolve_session(self, info: ResolveInfo) -> SessionInfo:
        return SessionInfo()

    def resolve_example_query(self, info: ResolveInfo) -> ExampleQuery:
        return ExampleQuery()


schema = graphene.Schema(query=Query, mutation=Mutations)
