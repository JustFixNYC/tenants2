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


class OnboardingStep1(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep1Form

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep1Form, info: ResolveInfo):
        request = info.context
        request.session[ONBOARDING_STEP_1_SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=get_session_info())


class OnboardingStep2(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep2Form

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep2Form, info: ResolveInfo):
        request = info.context
        request.session[ONBOARDING_STEP_2_SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=get_session_info())


class OnboardingStep3(DjangoFormMutation):
    class Meta:
        form_class = forms.OnboardingStep3Form

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.OnboardingStep3Form, info: ResolveInfo):
        request = info.context
        request.session[ONBOARDING_STEP_3_SESSION_KEY] = form.cleaned_data
        return cls(errors=[], session=get_session_info())


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
    onboarding_step_1 = OnboardingStep1.Field(required=True)
    onboarding_step_2 = OnboardingStep2.Field(required=True)
    onboarding_step_3 = OnboardingStep3.Field(required=True)
    onboarding_step_4 = OnboardingStep4.Field(required=True)


class OnboardingSessionInfo(object):
    onboarding_step_1 = graphene.Field(OnboardingStep1Info)

    onboarding_step_2 = graphene.Field(OnboardingStep2Info)

    onboarding_step_3 = graphene.Field(OnboardingStep3Info)

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
