from typing import Any, Dict
from django.http import HttpRequest
from laletterbuilder import letter_sending
from onboarding.scaffolding import purge_scaffolding
from onboarding.schema import complete_onboarding
from onboarding.schema_util import mutation_requires_onboarding
from project.schema_base import purge_last_queried_phone_number
from project.util.letter_sending import does_user_have_ll_mailing_addr_or_email
from project.util.session_mutation import SessionFormMutation
from users.models import JustfixUser
from users.email_verify import send_verification_email_async
from project import schema_registry
from onboarding.models import SIGNUP_INTENT_CHOICES
from norent.schema import BaseCreateAccount
from laletterbuilder.forms import CreateAccount
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
        user.send_sms_async(
            f"Welcome to {site_util.get_site_name()}, {user.best_first_name}! "
            f"We'll be sending you notifications from this phone number.",
        )
        pass
    
    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        allinfo = cls.get_previous_step_info(request)
        if allinfo is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        allinfo.update(form.cleaned_data)
        password = form.cleaned_data["password"]
        allinfo["email"] = form.cleaned_data.get("email", "")
        allinfo["agreed_to_laletterbuilder_terms"] = True
        cls.update_onboarding_info(form, allinfo)
        user = complete_onboarding(request, info=allinfo, password=password)
        cls.perform_post_onboarding(form, request, user)

        if user.email:
            send_verification_email_async(user.pk)

        purge_last_queried_phone_number(request)
        purge_scaffolding(request)

        return cls.mutation_success()


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
