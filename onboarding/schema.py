import logging
from typing import Optional, Dict, Any, List, Type
from django.contrib.auth import login
from django.conf import settings
from django.http import HttpRequest
import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
from django.db import transaction

from project.util.django_graphql_session_forms import (
    DjangoSessionFormObjectType,
    DjangoSessionFormMutation
)
from project.util.session_mutation import SessionFormMutation
from project.util.site_util import get_site_name
from project import slack, schema_registry
from users.models import JustfixUser
from project.util.model_form_util import OneToOneUserModelFormMutation
from users.email_verify import send_verification_email_async
from onboarding import forms
from onboarding.models import (
    OnboardingInfo, BOROUGH_CHOICES, LEASE_CHOICES, SIGNUP_INTENT_CHOICES)


logger = logging.getLogger(__name__)


def session_key_for_step(step: int) -> str:
    '''
    We store the results of the user's onboarding steps in
    the session. This function returns the key we use to
    store the data for a particular step in.
    '''

    return f'onboarding_step_v{forms.FIELD_SCHEMA_VERSION}_{step}'


class OnboardingStep1Info(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.OnboardingStep1Form
        session_key = session_key_for_step(1)
        exclude = ['no_apt_number']


class OnboardingStep2Info(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.OnboardingStep2Form
        session_key = session_key_for_step(2)


class OnboardingStep3Info(DjangoSessionFormObjectType):
    class Meta:
        form_class = forms.OnboardingStep3Form
        session_key = session_key_for_step(3)


# The onboarding steps we store in the request session.
SESSION_STEPS: List[Type[DjangoSessionFormObjectType]] = [
    OnboardingStep1Info, OnboardingStep3Info]


@schema_registry.register_mutation
class OnboardingStep1(DjangoSessionFormMutation):
    class Meta:
        source = OnboardingStep1Info


@schema_registry.register_mutation
class OnboardingStep3(DjangoSessionFormMutation):
    class Meta:
        source = OnboardingStep3Info


def pick_model_fields(model, **kwargs):
    '''
    Return a dictionary containing only the passed-in kwargs
    that correspond to fields on the given model, e.g.:

        >>> from django.contrib.auth.models import User
        >>> pick_model_fields(User, boop=1, username='blah')
        {'username': 'blah'}
    '''

    model_fields = set([field.name for field in model._meta.get_fields()])

    return {
        key: kwargs[key]
        for key in kwargs if key in model_fields
    }


def complete_onboarding(request, info, password: Optional[str]):
    with transaction.atomic():
        user = JustfixUser.objects.create_user(
            username=JustfixUser.objects.generate_random_username(),
            first_name=info['first_name'],
            last_name=info['last_name'],
            email=info['email'],
            phone_number=info['phone_number'],
            password=password,
        )

        oi = OnboardingInfo(user=user, **pick_model_fields(
            OnboardingInfo, **info))
        oi.full_clean()
        oi.save()

    user.send_sms_async(
        f"Welcome to {get_site_name()}, {user.first_name}! "
        f"We'll be sending you notifications from this phone number.",
    )
    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
        f"from {slack.escape(oi.borough_label)} has signed up for "
        f"{slack.escape(SIGNUP_INTENT_CHOICES.get_label(oi.signup_intent))}!",
        is_safe=True
    )
    if user.email:
        send_verification_email_async(user.pk)

    user.backend = settings.AUTHENTICATION_BACKENDS[0]
    login(request, user)


class OnboardingStep4Base(SessionFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def __extract_all_step_session_data(cls, request: HttpRequest) -> Optional[Dict[str, Any]]:
        result: Dict[str, Any] = {}
        for step in SESSION_STEPS:
            value = step.get_dict_from_request(request)
            if not value:
                return None
            else:
                result.update(value)
        return result

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        allinfo = cls.__extract_all_step_session_data(request)
        if allinfo is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        allinfo.update(form.cleaned_data)
        password = form.cleaned_data['password'] or None
        allinfo['email'] = form.cleaned_data.get('email', '')
        allinfo['state'] = "NY"
        complete_onboarding(request, info=allinfo, password=password)

        for step in SESSION_STEPS:
            step.clear_from_request(request)

        return cls.mutation_success()


@schema_registry.register_mutation
class OnboardingStep4Version2(OnboardingStep4Base):
    class Meta:
        form_class = forms.OnboardingStep4FormVersion2


@schema_registry.register_mutation
class ReliefAttempts(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.ReliefAttemptsForm


BoroughEnum = graphene.Enum.from_enum(BOROUGH_CHOICES.enum)

LeaseTypeEnum = graphene.Enum.from_enum(LEASE_CHOICES.enum)


class OnboardingInfoType(DjangoObjectType):
    class Meta:
        model = OnboardingInfo
        only_fields = (
            'signup_intent', 'floor_number', 'address', 'apt_number', 'pad_bbl',
            'has_called_311', 'non_nyc_city', 'zipcode',)

    borough = graphene.Field(
        BoroughEnum,
        description=OnboardingInfo._meta.get_field('borough').help_text,
    )

    lease_type = graphene.Field(
        LeaseTypeEnum,
        description=OnboardingInfo._meta.get_field('lease_type').help_text,
    )

    # If we specify 'state' as a model field, graphene-django will turn
    # it into an enum where the empty string value is an invalid choice,
    # so instead we'll just coerce it to a string.
    state = graphene.String(
        required=True,
        description=OnboardingInfo._meta.get_field('state').help_text,
        resolver=lambda self, context: self.state,
    )

    city = graphene.String(
        required=True,
        description=OnboardingInfo.city.__doc__.strip(),  # type: ignore
        resolver=lambda self, context: self.city,
    )

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
    '''
    A mixin class defining all onboarding-related queries.
    '''

    onboarding_step_1 = OnboardingStep1Info.field()
    onboarding_step_2 = OnboardingStep2Info.field(
        deprecation_reason="See https://github.com/JustFixNYC/tenants2/issues/1144"
    )
    onboarding_step_3 = OnboardingStep3Info.field()
    onboarding_info = graphene.Field(
        OnboardingInfoType,
        description=(
            "The user's onboarding details, which they filled out "
            "during the onboarding process. This is not to be confused with "
            "the individual onboarding steps, which capture information "
            "someone filled out *during* onboarding, before they became "
            "a full-fledged user."
        )
    )

    def resolve_onboarding_info(self, info: ResolveInfo) -> Optional[OnboardingInfo]:
        user = info.context.user
        if hasattr(user, 'onboarding_info'):
            return user.onboarding_info
        return None
