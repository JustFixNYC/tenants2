import os
from typing import List
from graphql import ResolveInfo
import graphene
from graphene_django.types import DjangoObjectType
from django.contrib.staticfiles.storage import staticfiles_storage
from django.forms import formset_factory
from project.util.django_graphql_forms import DjangoFormMutation

from project.util.session_mutation import SessionFormMutation
from project.util.model_form_util import OneToOneUserModelFormMutation
from project.util.email_attachment import EmailAttachmentMutation
from project.util.site_util import absolutify_url
from project.util.graphql_mailing_address import GraphQLMailingAddress
from project import slack, schema_registry, common_data
from project.util import lob_api
from . import forms, models, email_letter, views, tasks
from .landlord_info_mutation import (
    BaseLandlordInfoMutation,
    BaseLandlordInfoMutationMeta,
)
from airtable.sync import sync_user as sync_user_with_airtable

MAX_RECIPIENTS = common_data.load_json("email-attachment-validation.json")["maxRecipients"]
MAX_TICKETS = 10


@schema_registry.register_mutation
class EmailLetter(EmailAttachmentMutation):
    attachment_name = "a letter of complaint"

    @classmethod
    def send_email(cls, user_id: int, recipients: List[str]):
        email_letter.email_letter_async(user_id, recipients)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        if not models.does_user_have_finished_loc(info.context.user):
            return cls.make_error("You have not completed a Letter of Complaint!")
        return super().perform_mutate(form, info)


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
class WorkOrderTickets(SessionFormMutation):
    login_required = True

    class Meta:
        form_class = forms.WorkOrderForm
        formset_classes = {
            "ticket_numbers": formset_factory(
                forms.TicketNumberForm,
                max_num=MAX_TICKETS,
                validate_max=True,
                formset=forms.TicketNumberFormset,
            )
        }

    @classmethod
    def perform_mutate(cls, form: forms.TicketNumberForm, info: ResolveInfo):
        request = info.context
        no_ticket = form.base_form.cleaned_data["no_ticket"]
        ticket_numbers = form.formsets["ticket_numbers"].get_cleaned_data(
            is_no_ticket_number_checked=no_ticket
        )
        if not ticket_numbers and not no_ticket:
            return cls.make_error(
                "Enter at least 1 ticket number or select `I don't have a ticket number.`"
            )
        models.WorkOrder.objects.set_for_user(request.user, ticket_numbers)
        return cls.mutation_success()


@schema_registry.register_mutation
class LandlordDetailsV2(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LandlordDetailsFormV2

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
                return models.LandlordDetails.create_or_update_lookup_for_user(user)
        return result

    @classmethod
    def perform_mutate(cls, form: forms.AccessDatesForm, info: ResolveInfo):
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
        url = absolutify_url("/loc/confirmation")

        if lr.mail_choice == "WE_WILL_MAIL":
            sync_user_with_airtable(request.user)
            lr.user.send_sms_async(
                f"We’re getting your Letter of Complaint ready to mail to your landlord. "
                f"We’ll text you a tracking link soon. "
                f"{os.linesep}"
                f"See letter: {url}"
            )
            tasks.send_admin_notification_for_letter.delay(lr.id)
        slack.sendmsg_async(
            f"{slack.hyperlink(text=lr.user.best_first_name, href=lr.user.admin_url)} "
            f"has completed a letter of complaint with the mail choice "
            f"*{slack.escape(models.LOC_MAILING_CHOICES.get_label(lr.mail_choice))}*!",
            is_safe=True,
        )
        return cls.mutation_success()


class LandlordDetailsType(DjangoObjectType):
    class Meta:
        model = models.LandlordDetails
        only_fields = (
            "name",
            "primary_line",
            "city",
            "zip_code",
            "is_looked_up",
            "email",
            "phone_number",
        )

    address = graphene.String(
        required=True,
        description=(
            "The full mailing address of the user, as a single string. Note "
            "that this may actually be populated even if individual address "
            "fields are empty; this represents legacy data created before we "
            "split up addresses into individual fields."
        ),
    )

    def resolve_address(self, context: ResolveInfo) -> str:
        return "\n".join(self.address_lines_for_mailing)

    # If we specify 'state' as a model field, graphene-django will turn
    # it into an enum where the empty string value is an invalid choice,
    # so instead we'll just coerce it to a string.
    state = graphene.String(required=True)

    def resolve_state(self, context: ResolveInfo) -> str:
        return self.state


class LetterRequestType(DjangoObjectType):
    class Meta:
        model = models.LetterRequest
        only_fields = ("mail_choice", "updated_at", "tracking_number", "letter_sent_at")


@schema_registry.register_session_info
class LocSessionInfo:
    access_dates = graphene.List(graphene.NonNull(graphene.types.String), required=True)
    work_order_tickets = graphene.List(graphene.NonNull(graphene.types.String))
    landlord_details = graphene.Field(LandlordDetailsType, resolver=LandlordDetailsV2.resolve)
    letter_request = graphene.Field(LetterRequestType, resolver=LetterRequest.resolve)

    def resolve_access_dates(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.AccessDate.objects.get_for_user(user)

    def resolve_work_order_tickets(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.WorkOrder.objects.get_for_user(user)


class LetterStyles(graphene.ObjectType):
    inline_pdf_css = graphene.String(
        required=True, description="Inline CSS to embed when generating PDFs from HTML."
    )

    html_css_urls = graphene.List(
        graphene.NonNull(graphene.String),
        required=True,
        description=("A list of stylesheet URLs to include in the HTML version " "of a letter."),
    )


@schema_registry.register_queries
class LocQueries:
    letter_styles = graphene.Field(
        LetterStyles, required=True, description="Details about CSS styling for business letters."
    )

    def resolve_letter_styles(self, info: ResolveInfo):
        return LetterStyles(
            inline_pdf_css=views.PDF_STYLES_CSS.read_text(),
            html_css_urls=[
                staticfiles_storage.url("/".join(views.LOC_FONTS_PATH_PARTS)),
                staticfiles_storage.url("/".join(views.PDF_STYLES_PATH_PARTS)),
                staticfiles_storage.url("/".join(views.LOC_PREVIEW_STYLES_PATH_PARTS)),
            ],
        )

    recommended_loc_landlord = graphene.Field(
        GraphQLMailingAddress,
        description=(
            "The recommended landlord address for "
            "Letter of Complaint for the currently "
            "logged-in user, if any."
        ),
    )

    def resolve_recommended_loc_landlord(self, info: ResolveInfo):
        request = info.context
        user = request.user
        if user.is_authenticated:
            ld = models.LandlordDetails.create_or_update_lookup_for_user(user, save=False)
            if ld and ld.primary_line:
                return GraphQLMailingAddress(
                    name=ld.name,
                    primary_line=ld.primary_line,
                    city=ld.city,
                    state=ld.state,
                    zip_code=ld.zip_code,
                )
        return None


@schema_registry.register_mutation
class LocLandlordInfo(BaseLandlordInfoMutation):
    class Meta(BaseLandlordInfoMutationMeta):
        pass
