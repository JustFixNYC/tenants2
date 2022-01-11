from typing import Any, Dict
from django.http import HttpRequest
from graphene_django.types import DjangoObjectType
from graphql import ResolveInfo
import graphene
from onboarding.scaffolding import update_scaffolding
from project.util.session_mutation import SessionFormMutation
from users.models import JustfixUser
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from norent.forms import CreateAccount
from . import forms, models


@schema_registry.register_mutation
class LaLetterBuilderCreateAccount(BaseCreateAccount):
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


"""
class LetterDetailsType(DjangoObjectType):
    class Meta:
        model = models.LaLetterDetails
        exclude_fields = ("user", "id")

"""


@schema_registry.register_mutation
class LaLetterBuilderChooseLetter(SessionFormMutation):
    class Meta:
        form_class = forms.ChooseLetterForm

    login_required = False

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        # TODO: have this set a variable that decides which
        # path the user goes down - perhaps just a redirect
        return cls.mutation_success()
