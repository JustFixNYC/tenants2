from typing import List
from graphql import ResolveInfo
import graphene
from graphene_django.types import DjangoObjectType

from project.util.session_mutation import SessionFormMutation
from project.util.model_form_util import OneToOneUserModelFormMutation
from project.util.email_attachment import EmailAttachmentMutation
from project.util.site_util import get_site_name
from project import slack, schema_registry, common_data
from . import forms, models, email_letter
from airtable.sync import sync_user as sync_user_with_airtable

MAX_RECIPIENTS = common_data.load_json("email-attachment-validation.json")['maxRecipients']


@schema_registry.register_mutation
class EmailLetter(EmailAttachmentMutation):
    attachment_name = "a letter of complaint"

    @classmethod
    def send_email(cls, user_id: int, recipients: List[str]):
        email_letter.email_letter_async(user_id, recipients)


@schema_registry.register_mutation
class AccessDates(SessionFormMutation):
    class Meta:
        form_class = forms.AccessDatesForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: forms.AccessDatesForm, info: ResolveInfo):
        request = info.context
        models.AccessDate.objects.set_for_user(request.user, form.get_cleaned_dates())
        return cls.mutation_success()


@schema_registry.register_mutation
class LandlordDetails(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LandlordDetailsForm


@schema_registry.register_mutation
class LandlordDetailsV2(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LandlordDetailsFormV2

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        result = super().resolve(parent, info)
        if result is None:
            user = info.context.user
            if user.is_authenticated:
                return models.LandlordDetails.create_lookup_for_user(user)
        return result

    @classmethod
    def perform_mutate(cls, form: forms.AccessDatesForm, info: ResolveInfo):
        ld = form.save(commit=False)

        # Update the legacy address field from all the parts the user just
        # filled out.
        ld.address = '\n'.join(ld.address_lines_for_mailing)
        # Because this has been changed via GraphQL, assume it has been
        # edited by a user; mark it as being no longer automatically
        # looked-up via open data.
        ld.is_looked_up = False
        ld.save()

        return cls.mutation_success()


@schema_registry.register_mutation
class OptionalLandlordDetails(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.OptionalLandlordDetailsForm


@schema_registry.register_mutation
class LetterRequest(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LetterRequestForm

    @classmethod
    def perform_mutate(cls, form: forms.LetterRequestForm, info: ResolveInfo):
        request = info.context
        lr = form.save()
        if lr.mail_choice == 'WE_WILL_MAIL':
            sync_user_with_airtable(request.user)
            lr.user.send_sms_async(
                f"{get_site_name()} here - we've received your request and will "
                f"update you once the letter has been sent. "
                f"Please allow for 1-2 business days to process.",
            )
        slack.sendmsg_async(
            f"{slack.hyperlink(text=lr.user.first_name, href=lr.user.admin_url)} "
            f"has completed a letter of complaint with the mail choice "
            f"*{slack.escape(models.LOC_MAILING_CHOICES.get_label(lr.mail_choice))}*!",
            is_safe=True
        )
        return cls.mutation_success()


class LandlordDetailsType(DjangoObjectType):
    class Meta:
        model = models.LandlordDetails
        only_fields = (
            'name',
            'address',
            'primary_line',
            'city',
            'zip_code',
            'is_looked_up',
            'email',
            'phone_number'
        )

    # If we specify 'state' as a model field, graphene-django will turn
    # it into an enum where the empty string value is an invalid choice,
    # so instead we'll just coerce it to a string.
    state = graphene.String(required=True)

    def resolve_state(self, context: ResolveInfo) -> str:
        return self.state


class LetterRequestType(DjangoObjectType):
    class Meta:
        model = models.LetterRequest
        only_fields = ('mail_choice', 'updated_at', 'tracking_number', 'letter_sent_at')


@schema_registry.register_session_info
class LocSessionInfo:
    access_dates = graphene.List(graphene.NonNull(graphene.types.String), required=True)
    landlord_details = graphene.Field(LandlordDetailsType, resolver=LandlordDetailsV2.resolve)
    letter_request = graphene.Field(LetterRequestType, resolver=LetterRequest.resolve)

    def resolve_access_dates(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.AccessDate.objects.get_for_user(user)
