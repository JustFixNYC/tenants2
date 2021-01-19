from typing import Any, Dict
from django.http import HttpRequest

from users.models import JustfixUser
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from norent.forms import CreateAccount


@schema_registry.register_mutation
class EvictionFreeCreateAccount(BaseCreateAccount):
    class Meta:
        form_class = CreateAccount

    require_email = False

    signup_intent = SIGNUP_INTENT_CHOICES.EVICTIONFREE

    @classmethod
    def update_onboarding_info(cls, form, info: Dict[str, Any]):
        info["agreed_to_evictionfree_terms"] = True

    @classmethod
    def perform_post_onboarding(cls, form, request: HttpRequest, user: JustfixUser):
        # TODO: Send SMS.
        pass
