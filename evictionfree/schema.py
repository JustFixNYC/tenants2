from onboarding.schema_util import mutation_requires_onboarding
from typing import Any, Dict
from django.http import HttpRequest
import graphene
from graphql import ResolveInfo
from graphene_django.types import DjangoObjectType
from django.utils.translation import gettext as _

from project.util.model_form_util import (
    OneToOneUserModelFormMutation,
    create_model_for_user_resolver,
)
from users.models import JustfixUser
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from norent.forms import CreateAccount
from project.util.session_mutation import SessionFormMutation
from project.util.django_graphql_forms import DjangoFormMutation
from project.util import site_util
from . import forms, models, declaration_sending, hardship_declaration


@schema_registry.register_mutation
class EvictionFreeCreateAccount(BaseCreateAccount):
    class Meta:
        form_class = CreateAccount

    require_email = False

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

    deprecation_reason = "Use EvictionFreeIndexNumberV2 instead."


@schema_registry.register_mutation
class EvictionFreeIndexNumberV2(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.IndexNumberFormV2


@schema_registry.register_mutation
class EvictionFreeAgreeToLegalTerms(DjangoFormMutation):
    class Meta:
        form_class = forms.AgreeToLegalTermsForm


@schema_registry.register_mutation
class EvictionFreeSigningTruthfully(DjangoFormMutation):
    class Meta:
        form_class = forms.SigningTruthfullyForm


@schema_registry.register_mutation
class EvictionFreeSubmitDeclaration(SessionFormMutation):
    login_required = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info):
        from norent.schema import does_user_have_ll_mailing_addr_or_email

        request = info.context
        user = request.user
        assert user.is_authenticated

        if hasattr(user, "submitted_hardship_declaration"):
            return cls.make_error(_("You have already sent a hardship declaration form!"))
        if not does_user_have_ll_mailing_addr_or_email(user):
            return cls.make_and_log_error(info, _("You haven't provided any landlord details yet!"))

        oi = user.onboarding_info
        if oi.state != "NY":
            return cls.make_and_log_error(
                info, _("You must be in the state of New York to use this tool!")
            )

        if not (
            hasattr(user, "hardship_declaration_details")
            and user.hardship_declaration_details.are_ready_for_submission()
        ):
            return cls.make_and_log_error(
                info, _("You haven't provided details for your hardship declaration form yet!")
            )

        site_type = site_util.get_site_type(site_util.get_site_from_request_or_default(request))

        if site_type != site_util.SITE_CHOICES.EVICTIONFREE:
            return cls.make_and_log_error(
                info, _("This form can only be used from the Eviction Free NY site.")
            )

        declaration_sending.create_and_send_declaration(user)

        return cls.mutation_success()


class SubmittedHardshipDeclarationType(DjangoObjectType):
    class Meta:
        model = models.SubmittedHardshipDeclaration
        only_fields = (
            "created_at",
            "mailed_at",
            "emailed_at",
            "emailed_to_housing_court_at",
            "emailed_to_user_at",
            "tracking_number",
        )


@schema_registry.register_session_info
class EvictionFreeSessionInfo:
    hardship_declaration_details = graphene.Field(
        HardshipDeclarationDetailsType,
        resolver=create_model_for_user_resolver(models.HardshipDeclarationDetails),
    )

    submitted_hardship_declaration = graphene.Field(
        SubmittedHardshipDeclarationType,
        resolver=create_model_for_user_resolver(models.SubmittedHardshipDeclaration),
    )


@schema_registry.register_queries
class EvictionFreeQueries:
    eviction_free_hardship_declaration_variables = graphene.Field(
        hardship_declaration.GraphQLHardshipDeclarationVariables,
        description=(
            "Values for filling out the fields of the COVID-19 hardship declaration for the "
            "currently logged-in user, or null if not enough information is available to fill "
            "out the form."
        ),
    )

    def resolve_eviction_free_hardship_declaration_variables(self, info: ResolveInfo):
        return hardship_declaration.get_vars_for_user(info.context.user)
