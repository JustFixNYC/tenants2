from typing import Any, Dict
from django.http import HttpRequest
from users.models import JustfixUser
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from norent.forms import CreateAccount
from project.util.model_form_util import OneToOneUserModelFormMutation
from loc import forms as loc_forms
from . import forms
import graphene
from graphql import ResolveInfo
from project.util import lob_api
from loc import models as loc_models


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


@schema_registry.register_mutation
class LandlordNameAddressEmail(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LandlordDetailsForm

    is_undeliverable = graphene.Boolean(
        description=(
            "Whether or not the provided address appears to be undeliverable. "
            "If Lob integration is disabled, there was a problem contacting Lob, "
            "or the mutation was unsuccessful, this will be null."
        )
    )

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        result = super().resolve(parent, info)
        if result is None:
            user = info.context.user
            if user.is_authenticated:
                return loc_models.LandlordDetails.create_or_update_lookup_for_user(user)
        return result

    @classmethod
    def perform_mutate(cls, form: loc_forms.AccessDatesForm, info: ResolveInfo):
        ld = form.save(commit=False)
        # Because this has been changed via GraphQL, assume it has been
        # edited by a user; mark it as being no longer automatically
        # looked-up via open data.
        ld.is_looked_up = False
        ld.save()

        return cls.mutation_success(
            is_undeliverable=lob_api.is_address_undeliverable(**ld.as_lob_params())
        )
