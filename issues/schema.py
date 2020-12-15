from typing import List
from graphql import ResolveInfo
import graphene
from graphene_django.types import DjangoObjectType
from django.db import transaction
from django.forms import inlineformset_factory

from users.models import JustfixUser
from project.util.model_form_util import (
    ManyToOneUserModelFormMutation,
    create_models_for_user_resolver,
)
from project import schema_registry
from . import forms, models


def save_custom_issues_formset_with_area(formset, area: str):
    instances = formset.save(commit=False)
    for instance in formset.deleted_objects:
        instance.delete()
    for instance in instances:
        instance.area = area
        instance.save()


@schema_registry.register_mutation
class IssueAreaV2(ManyToOneUserModelFormMutation):
    class Meta:
        form_class = forms.IssueAreaFormV2
        formset_classes = {
            "custom_issues": inlineformset_factory(
                JustfixUser,
                models.CustomIssue,
                forms.CustomIssueForm,
                can_delete=True,
                max_num=forms.MAX_CUSTOM_ISSUES_PER_AREA,
                validate_max=True,
            )
        }

    @classmethod
    def get_formset_kwargs(cls, root, info: ResolveInfo, formset_name, input, all_input):
        kwargs = super().get_formset_kwargs(root, info, formset_name, input, all_input)
        kwargs["queryset"] = models.CustomIssue.objects.filter(area=all_input["area"])
        return kwargs

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        user = info.context.user
        area = form.base_form.cleaned_data["area"]
        with transaction.atomic():
            save_custom_issues_formset_with_area(form.formsets["custom_issues"], area)
            models.Issue.objects.set_area_issues_for_user(
                user, area, form.base_form.cleaned_data["issues"]
            )
        return cls.mutation_success()


class CustomIssueV2(DjangoObjectType):
    class Meta:
        model = models.CustomIssue
        exclude_fields = ("user", "created_at", "updated_at")


@schema_registry.register_session_info
class IssueSessionInfo:
    issues = graphene.List(graphene.NonNull(graphene.String), required=True)

    custom_issues_v2 = graphene.List(
        graphene.NonNull(CustomIssueV2),
        resolver=create_models_for_user_resolver(models.CustomIssue),
    )

    def resolve_issues(self, info: ResolveInfo) -> List[str]:
        user = info.context.user
        if not user.is_authenticated:
            return []
        return [issue.value for issue in user.issues.all()]
