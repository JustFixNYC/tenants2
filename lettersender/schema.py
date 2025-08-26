from typing import Any, Dict, List
from django.http import HttpRequest
from django.db import transaction
from amplitude.models import LoggedEvent
from lettersender import letter_sending, models
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
from lettersender.forms import (
    CreateAccount,
    GoodCauseIssuesForm,
    LandlordDetailsForm,
    SendOptionsForm,
    DownloadLetterPDFForm,
    OverchargeDetailsForm,
)
from project.util.model_form_util import (
    OneToOneUserModelFormMutation,
)
import graphene
from graphql import ResolveInfo
from project.util import lob_api, site_util
from loc import models as loc_models
from graphene_django.types import DjangoObjectType
from django.core.exceptions import MultipleObjectsReturned


@schema_registry.register_mutation
class LetterSenderCreateAccount(BaseCreateAccount):
    class Meta:
        form_class = CreateAccount

    require_email = False

    signup_intent = SIGNUP_INTENT_CHOICES.LETTERSENDER

    @classmethod
    def update_onboarding_info(cls, form, info: Dict[str, Any]):
        info["agreed_to_lettersender_terms"] = True

    @classmethod
    def perform_post_onboarding(cls, form, request: HttpRequest, user: JustfixUser):
        user.send_sms_async(
            f"Welcome to {site_util.get_site_name()}, {user.best_first_name}! "
            f"We'll be sending you notifications from this phone number.",
        )
        pass

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        """
        Overloading BaseCreateAccount to get email from this form rather than an earlier step
        """
        request = info.context
        allinfo = cls.get_previous_step_info(request)
        if allinfo is None:
            cls.log(info, "User has not completed previous steps, aborting mutation.")
            return cls.make_error("You haven't completed all the previous steps yet.")
        allinfo.update(form.cleaned_data)
        password = form.cleaned_data["password"]
        allinfo["email"] = form.cleaned_data.get("email", "")
        allinfo["agreed_to_lettersender_terms"] = True
        cls.update_onboarding_info(form, allinfo)
        user = complete_onboarding(request, info=allinfo, password=password)
        cls.perform_post_onboarding(form, request, user)

        if user.email:
            send_verification_email_async(user.pk)

        purge_last_queried_phone_number(request)
        purge_scaffolding(request)

        return cls.mutation_success()


@schema_registry.register_mutation
class LandlordNameAddress(OneToOneUserModelFormMutation):
    class Meta:
        form_class = LandlordDetailsForm

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
        # TODO: maybe can remove this if case?
        if result is None:
            user = info.context.user
            if user.is_authenticated:
                return loc_models.LandlordDetails.create_or_update_lookup_for_user(user)
        return result

    @classmethod
    def perform_mutate(cls, form: LandlordDetailsForm, info: ResolveInfo):
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
class LetterSenderCreateLetter(SessionFormMutation):
    """
    Create a blank letter object for the user. This enables saving repairs info, etc. on a letter
    object instead of the user object, which is needed in case the user has multiple letters in
    progress.
    """

    login_required = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        assert user.is_authenticated

        site_type = site_util.get_site_type(site_util.get_site_from_request_or_default(request))
        if site_type not in [site_util.SITE_CHOICES.LETTERSENDER]:
            return cls.make_and_log_error(
                info, "This form can only be used from the Letter Sender site."
            )
        
        # Check if user already has an unsent letter
        existing_unsent_letters = models.LetterSenderLetter.objects.filter(
            user=user, 
            letter_sent_at=None, 
            letter_emailed_at=None, 
            fully_processed_at=None
        )
        
        if existing_unsent_letters.exists():
            cls.log(info, f"User {user} already has an unsent letter, skipping creation")
            return cls.mutation_success()
        
        letter_sending.create_letter(user)
        # LoggedEvent.objects.create_for_request(
        #     request, kind=LoggedEvent.CHOICES.LATENANTS_LETTER_CREATE
        # )

        return cls.mutation_success()


@schema_registry.register_mutation
class LetterSenderSendLetter(SessionFormMutation):
    """
    Send the user's letter
    """

    # TODO: add a form here

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

        if site_type not in [site_util.SITE_CHOICES.LETTERSENDER]:
            return cls.make_and_log_error(
                info, "This form can only be used from the Letter Sender site."
            )

        # TODO: Get user's preference for mailing

        # Send the letter
        letter = models.LetterSenderLetter.objects.get(
            user=request.user, letter_sent_at=None, letter_emailed_at=None, fully_processed_at=None
        )
        letter_sending.send_letter(letter)
        # LoggedEvent.objects.create_for_request(
        #     request, kind=LoggedEvent.CHOICES.LATENANTS_LETTER_SEND
        # )

        return cls.mutation_success()


@schema_registry.register_mutation
class LetterSenderIssues(SessionFormMutation):
    """
    Save the user's issues on their letter
    """

    class Meta:
        form_class = GoodCauseIssuesForm

    login_required = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        assert user.is_authenticated

        with transaction.atomic():
            # Get most recent unsent letter. This relies on there
            # only being one unsent habitability letter at a time.
            letters = models.LetterSenderLetter.objects.filter(
                user=user, letter_sent_at=None, letter_emailed_at=None, fully_processed_at=None
            )
            if not letters:
                cls.log(info, f"Could not find an unsent GCE letter for user {user}")
                return cls.make_error(
                    f"Could not find an unsent GCE letter for user {user}"
                )
            if len(letters) > 1:
                cls.log(
                    info,
                    f"Found multiple unsent GCE letters for {user}. "
                    + "There should only ever be one.",
                )
                return cls.make_error(
                    f"Found multiple unsent GCE letters for {user}. "
                    + "There should only ever be one.",
                )
            letter = letters[0]

            models.LetterSenderIssue.objects.set_issues_for_letter(letter, form.cleaned_data["gce_issues"])

        return cls.mutation_success()


@schema_registry.register_mutation
class LetterSenderOverchargeDetails(SessionFormMutation):
    """
    Save the user's overcharge details
    """

    class Meta:
        form_class = OverchargeDetailsForm

    login_required = True

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        assert user.is_authenticated

        with transaction.atomic():
            # Get or create overcharge details for the user
            overcharge_details, created = models.LetterSenderOverchargeDetails.objects.get_or_create(
                user=user,
                defaults={
                    'overcharge_applies': form.cleaned_data["overcharge_applies"]
                }
            )
            
            if not created:
                # Update existing record
                overcharge_details.overcharge_applies = form.cleaned_data["overcharge_applies"]
                overcharge_details.save()

        return cls.mutation_success()


@schema_registry.register_mutation
class LetterSenderSendOptions(SessionFormMutation):
    class Meta:
        form_class = SendOptionsForm

    login_required = True

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        return super().resolve(parent, info)

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        # Get most recent unsent letter. This relies on there
        # only being one unsent habitability letter at a time.
        # TODO: copied from LaLetterBuilderIssues, refactor to shared function in session
        with transaction.atomic():
            user = info.context.user
            letters = models.LetterSenderLetter.objects.filter(
                user=user, letter_sent_at=None, letter_emailed_at=None, fully_processed_at=None
            )
            if not letters:
                cls.log(info, f"Could not find an unsent GCE letter for user {user}")
                return cls.make_error(
                    f"Could not find an unsent GCE letter for user {user}"
                )
            if len(letters) > 1:
                cls.log(
                    info,
                    f"Found multiple unsent GCE letters for {user}. "
                    + "There should only ever be one.",
                )
                return cls.make_error(
                    f"Found multiple unsent GCE letters for {user}. "
                    + "There should only ever be one."
                )
            letter = letters[0]

            letter.mail_choice = form.cleaned_data["mail_choice"]
            letter.email_to_landlord = not form.cleaned_data["no_landlord_email"]
            letter.save()

            landlord_details = loc_models.LandlordDetails.objects.get(user=user)
            if form.cleaned_data["email"] != "":
                landlord_details.email = form.cleaned_data["email"]
            landlord_details.save()
        return cls.mutation_success()


@schema_registry.register_mutation
class LetterSenderDownloadPDF(SessionFormMutation):
    class Meta:
        form_class = DownloadLetterPDFForm

    login_required = True

    pdf_base64 = graphene.String(
        required=True,
        description=("The letter PDF in base64-encoded form, returned by the mutation."),
    )

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        return super().resolve(parent, info)

    @classmethod
    @mutation_requires_onboarding
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context

        with transaction.atomic():
            user = info.context.user
            letter_id = form.cleaned_data["letter_id"]
            letters = models.LetterSenderLetter.objects.filter(user=user, id=letter_id)
            letter = letters[0]
            if not letter:
                cls.log(info, f"Could not find habitability letter matching id {letter_id}")
                return cls.make_error(f"Could not find habitability letter matching id {letter_id}")
            if not letter.pdf_base64:
                cls.log(
                    info,
                    f"Could not find PDF bytes for letter with id {letter_id}. \
                    Has the letter been fully processed?",
                )
                return cls.make_error(
                    f"Could not find PDF bytes for letter with id {letter_id}. \
                        Has the letter been fully processed?"
                )
            # LoggedEvent.objects.create_for_request(
            #     request, kind=LoggedEvent.CHOICES.LATENANTS_LETTER_DOWNLOAD
            # )
        return cls.mutation_success(pdf_base64=letter.pdf_base64)


class GoodCauseLetterType(DjangoObjectType):
    class Meta:
        model = models.LetterSenderLetter
        only_fields = (
            "id",
            "tracking_number",
            "letter_sent_at",
            "created_at",
            "fully_processed_at",
            "mail_choice",
            "email_to_landlord",
        )


@schema_registry.register_session_info
class LetterSenderSessionInfo:

    has_gce_letter_in_progress = graphene.Boolean(
        description=(
            "Whether a user has started a gce letter. "
            "If true, that means the user has clicked Start Letter "
            "on the MyLetters page."
        ),
    )

    gce_issues = graphene.List(graphene.NonNull(graphene.String), required=True)

    overcharge_details = graphene.Field(
        graphene.Boolean,
        description="Whether the overcharge situation applies to the user."
    )

    gce_latest_letter = graphene.Field(
        GoodCauseLetterType,
        description=(
            "The latest gce letter sent by the user. If the user has never "
            "sent a letter or is not logged in, this will be null."
        ),
    )

    gce_letters = graphene.List(
        graphene.NonNull(GoodCauseLetterType),
        description=(
            "All gce letters that have been created (sent and unsent) by the user"
        ),
    )

    def resolve_gce_issues(self, info: ResolveInfo) -> List[str]:
        user = info.context.user
        if not user.is_authenticated:
            return []

        letters = models.LetterSenderLetter.objects.filter(
            user=user, letter_sent_at=None, letter_emailed_at=None, fully_processed_at=None
        )  # TODO: save this in the session instead of fetching it every time?
        if not letters:
            return []
        if len(letters) > 1:
            # This should never happen - users should not be able to create more than
            # one habitability letter at a time
            # Keep only the most recent letter, delete the others
            sorted_letters = letters.order_by('-created_at')
            letters_to_delete = sorted_letters[1:]
            
            for letter in letters_to_delete:
                letter.delete()
            
            # Use the most recent letter
            letter = sorted_letters[0]
        else:
            letter = letters[0]
            
        return models.LetterSenderIssue.objects.get_issues_for_letter(letter)

    def resolve_overcharge_details(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return None

        try:
            overcharge_details = models.LetterSenderOverchargeDetails.objects.get(user=user)
            return overcharge_details.overcharge_applies
        except models.LetterSenderOverchargeDetails.DoesNotExist:
            return None

    def resolve_has_gce_letter_in_progress(self, info: ResolveInfo):
        request = info.context
        if not request.user.is_authenticated:
            return False
        return models.LetterSenderLetter.objects.filter(
            user=request.user, letter_sent_at=None, letter_emailed_at=None, fully_processed_at=None
        ).exists()

    def resolve_gce_latest_letter(self, info: ResolveInfo):
        request = info.context
        if not request.user.is_authenticated:
            return None
        return models.LetterSenderLetter.objects.filter(user=request.user).first()

    def resolve_gce_letters(self, info: ResolveInfo):
        request = info.context
        if not request.user.is_authenticated:
            return None
        return models.LetterSenderLetter.objects.filter(user=request.user)
