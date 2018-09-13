from graphql import ResolveInfo
import graphene
from django.utils.module_loading import import_string
from graphene_django.types import DjangoObjectType

from project.util.django_graphql_forms import DjangoFormMutation
from . import forms, models


class AccessDates(DjangoFormMutation):
    class Meta:
        form_class = forms.AccessDatesForm

    login_required = True

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.AccessDatesForm, info: ResolveInfo):
        request = info.context
        models.AccessDate.objects.set_for_user(request.user, form.get_cleaned_dates())
        return AccessDates(session=import_string('project.schema.SessionInfo'))


class LandlordDetails(DjangoFormMutation):
    class Meta:
        form_class = forms.LandlordDetailsForm

    login_required = True

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def get_form_kwargs(cls, root, info: ResolveInfo, **input):
        user = info.context.user
        if hasattr(user, 'landlord_details'):
            details = user.landlord_details
        else:
            details = models.LandlordDetails(user=user)
        return {"data": input, "instance": details}

    @classmethod
    def perform_mutate(cls, form: forms.LandlordDetailsForm, info: ResolveInfo):
        form.save()
        return LandlordDetails(session=import_string('project.schema.SessionInfo'))


class LetterRequest(DjangoFormMutation):
    class Meta:
        form_class = forms.LetterRequestForm

    login_required = True

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def get_form_kwargs(cls, root, info: ResolveInfo, **input):
        user = info.context.user
        if hasattr(user, 'letter_request'):
            details = user.letter_request
        else:
            details = models.LetterRequest(user=user)
        return {"data": input, "instance": details}

    @classmethod
    def perform_mutate(cls, form: forms.LetterRequestForm, info: ResolveInfo):
        form.save()
        return LetterRequest(session=import_string('project.schema.SessionInfo'))


class LocMutations:
    access_dates = AccessDates.Field(required=True)
    landlord_details = LandlordDetails.Field(required=True)
    letter_request = LetterRequest.Field(required=True)


class LandlordDetailsType(DjangoObjectType):
    class Meta:
        model = models.LandlordDetails
        only_fields = ('name', 'address')


class LetterRequestType(DjangoObjectType):
    class Meta:
        model = models.LetterRequest
        only_fields = ('mail_choice', 'updated_at')


class LocSessionInfo:
    access_dates = graphene.List(graphene.NonNull(graphene.types.String), required=True)
    landlord_details = graphene.Field(LandlordDetailsType)
    letter_request = graphene.Field(LetterRequestType)

    def resolve_access_dates(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.AccessDate.objects.get_for_user(user)

    def resolve_landlord_details(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated or not hasattr(user, 'landlord_details'):
            return None
        return user.landlord_details

    def resolve_letter_request(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated or not hasattr(user, 'letter_request'):
            return None
        return user.letter_request
