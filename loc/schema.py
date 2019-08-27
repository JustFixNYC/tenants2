from graphql import ResolveInfo
import graphene
from graphene_django.types import DjangoObjectType
from django.forms import formset_factory

from project.util.session_mutation import SessionFormMutation
from project.util.model_form_util import OneToOneUserModelFormMutation
from project.util.django_graphql_forms import DjangoFormMutation
from project import slack, schema_registry, common_data
from . import forms, models, email_letter
from airtable.sync import sync_user as sync_user_with_airtable

MAX_RECIPIENTS = common_data.load_json("email-attachment-validation.json")['maxRecipients']


@schema_registry.register_mutation
class EmailLetter(DjangoFormMutation):
    class Meta:
        formset_classes = {
            'recipients': formset_factory(
                forms.EmailForm,
                max_num=MAX_RECIPIENTS,
                validate_max=True,
                min_num=1,
                validate_min=True
            )
        }

    login_required = True

    recipients = graphene.List(graphene.NonNull(graphene.String))

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        user = request.user
        recipients = [f.cleaned_data['email'] for f in form.formsets['recipients']]
        email_letter.email_letter_async(user.pk, recipients)
        return cls(errors=[], recipients=recipients)


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

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        result = super().resolve(parent, info)
        if result is None:
            user = info.context.user
            if user.is_authenticated:
                return models.LandlordDetails.create_lookup_for_user(user)
        return result


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
                f"JustFix.nyc here - we've received your request and will "
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
        only_fields = ('name', 'address', 'is_looked_up')


class LetterRequestType(DjangoObjectType):
    class Meta:
        model = models.LetterRequest
        only_fields = ('mail_choice', 'updated_at')


@schema_registry.register_session_info
class LocSessionInfo:
    access_dates = graphene.List(graphene.NonNull(graphene.types.String), required=True)
    landlord_details = graphene.Field(LandlordDetailsType, resolver=LandlordDetails.resolve)
    letter_request = graphene.Field(LetterRequestType, resolver=LetterRequest.resolve)

    def resolve_access_dates(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.AccessDate.objects.get_for_user(user)
