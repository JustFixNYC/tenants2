from typing import Optional
from enum import Enum
import graphene
from graphql import ResolveInfo
from django.contrib.auth import logout, login, authenticate
from django.middleware import csrf
from django.forms import formset_factory

from users.models import JustfixUser
from project.graphql_static_request import GraphQLStaticRequest
from project.util.django_graphql_forms import DjangoFormMutation
from project.util.session_mutation import SessionFormMutation
from frontend import safe_mode
from . import forms, password_reset, schema_registry


LAST_QUERIED_PHONE_NUMBER_SESSION_KEY = '_last_queried_phone_number'

LAST_QUERIED_PHONE_NUMBER_STATUS_SESSION_KEY = '_last_queried_phone_number_status'


class PhoneNumberAccountStatus(Enum):
    NO_ACCOUNT = 0
    ACCOUNT_WITHOUT_PASSWORD = 1
    ACCOUNT_WITH_PASSWORD = 2


GraphQlPhoneNumberAccountStatus = graphene.Enum.from_enum(PhoneNumberAccountStatus)


def get_last_queried_phone_number(request) -> Optional[str]:
    return request.session.get(LAST_QUERIED_PHONE_NUMBER_SESSION_KEY)


def update_last_queried_phone_number(
    request,
    phone_number: str,
    status: PhoneNumberAccountStatus
):
    request.session[LAST_QUERIED_PHONE_NUMBER_STATUS_SESSION_KEY] = status.name
    request.session[LAST_QUERIED_PHONE_NUMBER_SESSION_KEY] = phone_number


def purge_last_queried_phone_number(request):
    if LAST_QUERIED_PHONE_NUMBER_STATUS_SESSION_KEY in request.session:
        del request.session[LAST_QUERIED_PHONE_NUMBER_STATUS_SESSION_KEY]
    if LAST_QUERIED_PHONE_NUMBER_SESSION_KEY in request.session:
        del request.session[LAST_QUERIED_PHONE_NUMBER_SESSION_KEY]


@schema_registry.register_session_info
class BaseSessionInfo:
    user_id = graphene.Int(
        description=(
            "The ID of the currently logged-in user, or null if not logged-in."
        )
    )

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

    last_queried_phone_number = graphene.String(
        description=(
            "The phone number most recently queried, or null if none."
        )
    )

    last_queried_phone_number_account_status = graphene.Field(
        GraphQlPhoneNumberAccountStatus,
        description=(
            "The account status of the phone number most recently queried, "
            "or null if none."
        )
    )

    email = graphene.String(
        description=(
            "The email of the currently logged-in user, or "
            "null if not logged-in. Note that this can be an empty "
            "string if the user hasn't yet given us their email."
        )
    )

    is_email_verified = graphene.Boolean(
        description=(
            "Whether the user's email address has been verified, or "
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

    prefers_legacy_app = graphene.Boolean(
        description=(
            "Whether we should redirect this user to the legacy "
            "tenant app after they log in. If null, the user is either not "
            "a legacy user, or legacy app integration is disabled."
        ),
        deprecation_reason=(
            "Legacy app integration is no longer relevant since the "
            "legacy app was decommissioned on August 3, 2020."
        )
    )

    def resolve_prefers_legacy_app(self, info: ResolveInfo) -> Optional[bool]:
        return None

    example_deprecated_field = graphene.String(
        description="An example deprecated session field.",
        deprecation_reason=(
            "This is an example of a deprecated session field. "
            "It should never appear in auto-generated GraphQL queries "
            "because it is deprecated, but it can still be queried, "
            "which will allow legacy clients asking for it to not "
            "crash."
        )
    )

    def resolve_user_id(self, info: ResolveInfo) -> Optional[int]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return request.user.pk

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

    def resolve_last_queried_phone_number(self, info: ResolveInfo) -> Optional[str]:
        return get_last_queried_phone_number(info.context)

    def resolve_last_queried_phone_number_account_status(
        self, info: ResolveInfo
    ) -> Optional[PhoneNumberAccountStatus]:
        request = info.context
        status = request.session.get(LAST_QUERIED_PHONE_NUMBER_STATUS_SESSION_KEY)
        if status:
            return getattr(PhoneNumberAccountStatus, status)
        return None

    def resolve_email(self, info: ResolveInfo) -> Optional[str]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return request.user.email

    def resolve_is_email_verified(self, info: ResolveInfo) -> Optional[bool]:
        request = info.context
        if not request.user.is_authenticated:
            return None
        return request.user.is_email_verified

    def resolve_csrf_token(self, info: ResolveInfo) -> str:
        request = info.context
        if isinstance(request, GraphQLStaticRequest):
            # The request is coming from front-end code that's trying
            # to generate static content; it won't even need a CSRF
            # token, so we'll just return an empty string.
            return ''
        return csrf.get_token(request)

    def resolve_is_staff(self, info: ResolveInfo) -> bool:
        return info.context.user.is_staff

    def resolve_is_safe_mode_enabled(self, info: ResolveInfo) -> bool:
        return safe_mode.is_enabled(info.context)


@schema_registry.register_mutation
class Example(DjangoFormMutation):
    class Meta:
        exclude_fields = ['field_to_ignore']
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


@schema_registry.register_mutation
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


@schema_registry.register_mutation
class Login(SessionFormMutation):
    '''
    A mutation to log in the user. Returns whether or not the login was successful
    (if it wasn't, it's because the credentials were invalid). It also returns
    a new CSRF token, because as the Django docs state, "For security reasons,
    CSRF tokens are rotated each time a user logs in":

        https://docs.djangoproject.com/en/2.1/ref/csrf/
    '''

    class Meta:
        form_class = forms.LoginForm

    @classmethod
    def perform_mutate(cls, form: forms.LoginForm, info: ResolveInfo):
        request = info.context
        login(request, form.authenticated_user)
        return cls.mutation_success()


@schema_registry.register_mutation
class Logout(SessionFormMutation):
    '''
    Logs out the user. Clients should pay attention to the
    CSRF token, because apparently this changes on logout too.
    '''

    class Meta:
        form_class = forms.LogoutForm

    session = graphene.NonNull('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.LogoutForm, info: ResolveInfo):
        request = info.context
        logout(request)
        return cls.mutation_success()


@schema_registry.register_mutation
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


@schema_registry.register_mutation
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


@schema_registry.register_mutation
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


@schema_registry.register_mutation
class PasswordResetConfirmAndLogin(SessionFormMutation):
    '''
    Like PasswordResetConfirm, but also logs the user in.
    '''

    class Meta:
        form_class = forms.SetPasswordForm

    @classmethod
    def perform_mutate(cls, form: forms.SetPasswordForm, info: ResolveInfo):
        request = info.context
        password = form.cleaned_data['password']
        user_id = password_reset.get_user_id_of_password_reset_user(request)
        err_str = password_reset.set_password(request, password)
        if err_str is not None:
            return cls.make_error(err_str)

        assert user_id is not None
        user = JustfixUser.objects.get(pk=user_id)
        user = authenticate(phone_number=user.phone_number, password=password)
        assert user is not None
        login(request, user)

        return cls.mutation_success()


@schema_registry.register_mutation
class QueryOrVerifyPhoneNumber(SessionFormMutation):
    '''
    Return information about whether a phone number is associated with
    an account. If the account has no password set, this mutation will
    automatically send it a verification code, allowing its user to
    set their password.

    Note that the phone number provided will be stored in the request
    session so it can later be reused if the user decides to sign up.
    This means that any subsequent pages that use this mutation will
    need to provide the user with the ability to clear their session
    data (usually provided via a "cancel" button).
    '''

    class Meta:
        form_class = forms.PhoneNumberForm

    account_status = graphene.Field(
        GraphQlPhoneNumberAccountStatus,
        description=(
            "The account status of the user. If ACCOUNT_WITHOUT_PASSWORD, "
            "assume we have texted the user a verification code."
        ),
    )

    @classmethod
    def get_account_status_for_user(cls, request, user: JustfixUser) -> PhoneNumberAccountStatus:
        if user.has_usable_password():
            account_status = PhoneNumberAccountStatus.ACCOUNT_WITH_PASSWORD
        else:
            account_status = PhoneNumberAccountStatus.ACCOUNT_WITHOUT_PASSWORD
            password_reset.create_verification_code(request, user.phone_number)
        return account_status

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        phone_number = form.cleaned_data['phone_number']
        user = JustfixUser.objects.filter(phone_number=phone_number).first()
        if user:
            account_status = cls.get_account_status_for_user(request, user)
        else:
            account_status = PhoneNumberAccountStatus.NO_ACCOUNT
        update_last_queried_phone_number(
            request,
            phone_number,
            status=account_status,
        )
        return cls.mutation_success(account_status=account_status)


@schema_registry.register_queries
class BaseQuery:
    '''
    These are all our GraphQL query endpoints.
    '''

    session = graphene.NonNull('project.schema.SessionInfo')

    example_query = graphene.NonNull(ExampleQuery)

    def resolve_session(self, info: ResolveInfo):
        from project.schema import SessionInfo

        return SessionInfo()

    def resolve_example_query(self, info: ResolveInfo) -> ExampleQuery:
        return ExampleQuery()
