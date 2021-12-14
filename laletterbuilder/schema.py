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
from project.util.model_form_util import (
    create_model_for_user_resolver,
)
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


class LetterDetailsType(DjangoObjectType):
    class Meta:
        model = models.LaLetterDetails
        exclude_fields = ("user", "id")


@schema_registry.register_mutation
class LaLetterBuilderChooseLetter(SessionFormMutation):
    class Meta:
        form_class = forms.ChooseLetterTypeForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        ld = models.LaLetterDetails.objects.get_or_create(user=user)[0]
        ld.letter_type = form.cleaned_data["letter_type"]
        ld.save()
        update_scaffolding(request, {"letter_type": form.cleaned_data["letter_type"]})
        return cls.mutation_success()


@schema_registry.register_session_info
class LaLetterBuilderSessionInfo(object):
    la_letter_details = graphene.Field(
        LetterDetailsType, description="Type of letter the user is currently creating"
    )

    def resolve_la_letter_details(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return None
        return models.LaLetterDetails.objects.filter(
            user=user
        ).first()  # todo: change from first to most recent
