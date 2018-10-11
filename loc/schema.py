from graphql import ResolveInfo
import graphene
from graphene_django.types import DjangoObjectType
from django.forms import ModelForm

from project.util.session_mutation import SessionFormMutation
from . import forms, models


class OneToOneUserModelFormMutation(SessionFormMutation):
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
    def perform_mutate(cls, form: ModelForm, info: ResolveInfo):
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


class AccessDates(SessionFormMutation):
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

    @classmethod
    def perform_mutate(cls, form: forms.LetterRequestForm, info: ResolveInfo):
        request = info.context
        lr = form.save()
        if lr.mail_choice == 'WE_WILL_MAIL':
            lr.user.send_sms(
                f"We'll follow up with you about your letter of complaint "
                f"in about a week, {lr.user.first_name}.",
                fail_silently=True
            )
            lr.user.send_sms(
                f"You can also check on your letter's status by visiting "
                f"{request.build_absolute_uri('/')}.",
                fail_silently=True
            )
        return cls.mutation_success()


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
