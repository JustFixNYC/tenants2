from typing import Optional
import graphene
from graphql import ResolveInfo
from graphene_django.forms.mutation import fields_for_form

from project.util.django_graphql_forms import DjangoFormMutation
from onboarding import forms


ONBOARDING_STEP_1_SESSION_KEY = 'onboarding_step_1'

ONBOARDING_STEP_2_SESSION_KEY = 'onboarding_step_2'

ONBOARDING_STEP_3_SESSION_KEY = 'onboarding_step_3'


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

    SESSION_KEY = ONBOARDING_STEP_1_SESSION_KEY


class OnboardingStep2(StoreToSessionForm):
    class Meta:
        form_class = forms.OnboardingStep2Form

    SESSION_KEY = ONBOARDING_STEP_2_SESSION_KEY


class OnboardingStep3(StoreToSessionForm):
    class Meta:
        form_class = forms.OnboardingStep3Form

    SESSION_KEY = ONBOARDING_STEP_3_SESSION_KEY


class OnboardingStep4(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep4Form

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep4Form, info: ResolveInfo):
        # TODO: Actually create user account and associate onboarding details
        # from previous steps with it.
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
        return self.__get(info, ONBOARDING_STEP_1_SESSION_KEY, OnboardingStep1Info)

    def resolve_onboarding_step_2(self, info: ResolveInfo) -> Optional[OnboardingStep2Info]:
        return self.__get(info, ONBOARDING_STEP_2_SESSION_KEY, OnboardingStep2Info)

    def resolve_onboarding_step_3(self, info: ResolveInfo) -> Optional[OnboardingStep3Info]:
        return self.__get(info, ONBOARDING_STEP_3_SESSION_KEY, OnboardingStep3Info)
