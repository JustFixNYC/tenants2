from typing import Any, Dict
from django.http import HttpRequest
import graphene
from graphene_django.types import DjangoObjectType

from project.util.model_form_util import (
    OneToOneUserModelFormMutation,
    create_model_for_user_resolver,
)
from users.models import JustfixUser
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from norent.forms import CreateAccount
from . import forms, models


@schema_registry.register_mutation
class EvictionFreeCreateAccount(BaseCreateAccount):
    class Meta:
        form_class = CreateAccount

    require_email = True

    signup_intent = SIGNUP_INTENT_CHOICES.EVICTIONFREE

    @classmethod
    def update_onboarding_info(cls, form, info: Dict[str, Any]):
        info["agreed_to_evictionfree_terms"] = True
        info["can_rtc_sms"] = info["can_hj4a_sms"] = form.cleaned_data["can_we_sms"]

    @classmethod
    def perform_post_onboarding(cls, form, request: HttpRequest, user: JustfixUser):
        # TODO: Send SMS.
        pass


class HardshipDeclarationDetailsType(DjangoObjectType):
    class Meta:
        model = models.HardshipDeclarationDetails
        exclude_fields = ("user", "id")


@schema_registry.register_mutation
class EvictionFreeCovidImpact(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.CovidImpactForm


@schema_registry.register_mutation
class EvictionFreeIndexNumber(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.IndexNumberForm


@schema_registry.register_session_info
class EvictionFreeSessionInfo:
    hardship_declaration_details = graphene.Field(
        HardshipDeclarationDetailsType,
        resolver=create_model_for_user_resolver(models.HardshipDeclarationDetails),
    )
