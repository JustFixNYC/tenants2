from graphql import ResolveInfo
import graphene
from django.utils.module_loading import import_string
from graphene_django.types import DjangoObjectType

from project.util.django_graphql_forms import DjangoFormMutation
from . import forms, models


class SessionMutation(DjangoFormMutation):
    '''
    A base class that can be used for any form mutation
    that returns the current user's session.
    '''

    class Meta:
        abstract = True

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def mutation_success(cls, **kwargs):
        '''
        This can be returned by any perform_mutate() method
        to return a success condition along with the session.
        '''

        return cls(
            errors=[],
            session=import_string('project.schema.SessionInfo'),
            **kwargs
        )


class OneToOneUserModelFormMutation(SessionMutation):
    '''
    A base class that can be used to make any
    ModelForm that represents a one-to-one relationship
    with the user into a GraphQL mutation.
    '''

    class Meta:
        abstract = True

    login_required = True

    @classmethod
    def get_form_kwargs(cls, root, info: ResolveInfo, **input):
        '''
        Either create a new instance of our model, or get the
        existing one, and pass it on to the ModelForm.
        '''

        user = info.context.user
        model = cls._meta.form_class._meta.model
        try:
            instance = model.objects.get(user=user)
        except model.DoesNotExist:
            instance = model(user=user)
        return {"data": input, "instance": instance}

    @classmethod
    def perform_mutate(cls, form: forms.LetterRequestForm, info: ResolveInfo):
        '''
        Save the ModelForm, which will have already been populated with
        an instance of our model.
        '''

        form.save()
        return cls.mutation_success()

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        '''
        This can be used as a GraphQL resolver to get the
        related model instance for the current user.
        '''

        user = info.context.user
        if not user.is_authenticated:
            return None
        model = cls._meta.form_class._meta.model
        try:
            return model.objects.get(user=user)
        except model.DoesNotExist:
            return None


class AccessDates(SessionMutation):
    class Meta:
        form_class = forms.AccessDatesForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form: forms.AccessDatesForm, info: ResolveInfo):
        request = info.context
        models.AccessDate.objects.set_for_user(request.user, form.get_cleaned_dates())
        return cls.mutation_success()


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


class LetterRequest(OneToOneUserModelFormMutation):
    class Meta:
        form_class = forms.LetterRequestForm


class LocMutations:
    access_dates = AccessDates.Field(required=True)
    landlord_details = LandlordDetails.Field(required=True)
    letter_request = LetterRequest.Field(required=True)


class LandlordDetailsType(DjangoObjectType):
    class Meta:
        model = models.LandlordDetails
        only_fields = ('name', 'address', 'is_looked_up')


class LetterRequestType(DjangoObjectType):
    class Meta:
        model = models.LetterRequest
        only_fields = ('mail_choice', 'updated_at')


class LocSessionInfo:
    access_dates = graphene.List(graphene.NonNull(graphene.types.String), required=True)
    landlord_details = graphene.Field(LandlordDetailsType, resolver=LandlordDetails.resolve)
    letter_request = graphene.Field(LetterRequestType, resolver=LetterRequest.resolve)

    def resolve_access_dates(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.AccessDate.objects.get_for_user(user)
