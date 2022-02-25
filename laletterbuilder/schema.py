from typing import Any, Dict
from django.http import HttpRequest
from laletterbuilder import letter_sending
from onboarding.schema_util import mutation_requires_onboarding
from project.util.letter_sending import does_user_have_ll_mailing_addr_or_email
from project.util.session_mutation import SessionFormMutation
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
from project.util import lob_api, site_util
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


@schema_registry.register_mutation
class LaLetterBuilderSendLetter(SessionFormMutation):
    """
    Send the user's letter
    """

    login_required = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        assert user.is_authenticated

        if not does_user_have_ll_mailing_addr_or_email(user):
            return cls.make_and_log_error(info, "You haven't provided any landlord details yet!")

        site_type = site_util.get_site_type(site_util.get_site_from_request_or_default(request))

        if site_type != site_util.SITE_CHOICES.LALETTERBUILDER:
            return cls.make_and_log_error(
                info, "This form can only be used from the LA Letter Builder site."
            )

        letter_sending.create_and_send_letter(request.user)

        return cls.mutation_success()
