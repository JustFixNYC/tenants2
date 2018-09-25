from typing import Optional, Dict, Any
from django.contrib.auth import login
from django.conf import settings
from django.http import HttpRequest
import graphene
from graphql import ResolveInfo
from graphene_django.forms.mutation import fields_for_form

from project.util.django_graphql_forms import DjangoFormMutation
from users.models import JustfixUser
from onboarding import forms
from onboarding.models import OnboardingInfo


# The onboarding steps we store in the request session.
SESSION_STEPS = [1, 2, 3]


def session_key_for_step(step: int) -> str:
    '''
    We store the results of the user's onboarding steps in
    the session. This function returns the key we use to
    store the data for a particular step in.
    '''

    assert step in SESSION_STEPS
    return f'onboarding_step_v{forms.FIELD_SCHEMA_VERSION}_{step}'


def get_session_info():
    '''
    Instantiates a session info object. We need to import the
    package here to avoid a circular import.
    '''

    from project.schema import SessionInfo

    return SessionInfo()


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


class StoreToSessionForm(DjangoFormMutation):
    '''
    Abstract base class that just stores the form's cleaned data to
    the current request's session.

    Concrete subclasses must define a SESSION_KEY property that
    specifies the session key to use.
    '''

    class Meta:
        abstract = True

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        request.session[cls.SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=get_session_info())


class OnboardingStep1(StoreToSessionForm):
    class Meta:
        form_class = forms.OnboardingStep1Form

    SESSION_KEY = session_key_for_step(1)


class OnboardingStep2(StoreToSessionForm):
    class Meta:
        form_class = forms.OnboardingStep2Form

    SESSION_KEY = session_key_for_step(2)


class OnboardingStep3(StoreToSessionForm):
    class Meta:
        form_class = forms.OnboardingStep3Form

    SESSION_KEY = session_key_for_step(3)


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


class OnboardingStep4(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep4Form

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def __extract_all_step_session_data(cls, request: HttpRequest) -> Dict[str, Any]:
        result: Dict[str, Any] = {}
        for step in SESSION_STEPS:
            key = session_key_for_step(step)
            result.update(request.session[key])
            del request.session[key]
        return result

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep4Form, info: ResolveInfo):
        request = info.context
        phone_number = form.cleaned_data['phone_number']
        password = form.cleaned_data['password'] or None
        prev_steps = cls.__extract_all_step_session_data(request)
        user = JustfixUser.objects.create_user(
            username=phone_number,
            first_name=prev_steps['first_name'],
            last_name=prev_steps['last_name'],
            phone_number=phone_number,
            password=password,
        )

        oi = OnboardingInfo(user=user, **pick_model_fields(
            OnboardingInfo, **prev_steps, **form.cleaned_data))
        oi.full_clean()
        oi.save()

        user.backend = settings.AUTHENTICATION_BACKENDS[0]
        login(request, user)
        return cls(errors=[], session=get_session_info())


class OnboardingMutations:
    '''
    A mixin class defining all onboarding-related mutations.
    '''

    onboarding_step_1 = OnboardingStep1.Field(required=True)
    onboarding_step_2 = OnboardingStep2.Field(required=True)
    onboarding_step_3 = OnboardingStep3.Field(required=True)
    onboarding_step_4 = OnboardingStep4.Field(required=True)


class OnboardingSessionInfo(object):
    '''
    A mixin class defining all onboarding-related queries.
    '''

    onboarding_step_1 = graphene.Field(OnboardingStep1Info)
    onboarding_step_2 = graphene.Field(OnboardingStep2Info)
    onboarding_step_3 = graphene.Field(OnboardingStep3Info)

    def __get(self, info: ResolveInfo, key: str, field_class):
        request = info.context
        obinfo = request.session.get(key)
        return field_class(**obinfo) if obinfo else None

    def resolve_onboarding_step_1(self, info: ResolveInfo) -> Optional[OnboardingStep1Info]:
        return self.__get(info, session_key_for_step(1), OnboardingStep1Info)

    def resolve_onboarding_step_2(self, info: ResolveInfo) -> Optional[OnboardingStep2Info]:
        return self.__get(info, session_key_for_step(2), OnboardingStep2Info)

    def resolve_onboarding_step_3(self, info: ResolveInfo) -> Optional[OnboardingStep3Info]:
        return self.__get(info, session_key_for_step(3), OnboardingStep3Info)
