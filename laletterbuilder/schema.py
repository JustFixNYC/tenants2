from typing import Any, Dict
from django.http import HttpRequest
from graphql.execution.base import ResolveInfo
from onboarding.scaffolding import OnboardingScaffoldingOrUserDataMutation, update_scaffolding

from users.models import JustfixUser
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from norent.forms import CreateAccount
from laletterbuilder.forms import ChooseLetterTypeForm


@schema_registry.register_mutation
class LALetterBuilderCreateAccount(BaseCreateAccount):
    class Meta:
        form_class = CreateAccount

    require_email = False

    signup_intent = SIGNUP_INTENT_CHOICES.LALETTERBUILDER

    @classmethod
    def update_onboarding_info(cls, form, info: Dict[str, Any]):
        info["agreed_to_laletterbuilder_terms"] = True

    @classmethod
    def perform_post_onboarding(cls, form, request: HttpRequest, user: JustfixUser):
        # TODO: Send SMS.
        pass


@schema_registry.register_mutation
class LALetterBuilderChooseLetterType(OnboardingScaffoldingOrUserDataMutation):
    """
    Save which letters the user wants to send during this session.
    """

    class Meta:
        form_class = ChooseLetterTypeForm

    selected_letter_type = ""

    @classmethod
    def get_selected_letter(cls, form) -> str:
        return "habitability"  # change this

    @classmethod
    def perform_mutate_for_authenticated_user(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        oi = user.onboarding_info
        setattr(oi, cls.selected_letter_type, cls.get_selected_letter_type(form))
        oi.save()
        return cls.mutation_success()

    @classmethod
    def perform_mutate_for_anonymous_user(cls, form, info: ResolveInfo):
        update_scaffolding(
            info.context, {cls.selected_letter_type: cls.get_selected_letter_type(form)}
        )
        return cls.mutation_success()
