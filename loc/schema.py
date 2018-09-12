from graphql import ResolveInfo
import graphene
from django.utils.module_loading import import_string

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


class LocMutations:
    access_dates = AccessDates.Field(required=True)


class LocSessionInfo:
    access_dates = graphene.List(graphene.NonNull(graphene.types.String), required=True)

    def resolve_access_dates(self, info: ResolveInfo):
        user = info.context.user
        if not user.is_authenticated:
            return []
        return models.AccessDate.objects.get_for_user(user)
