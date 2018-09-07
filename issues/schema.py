from typing import List
from graphql import ResolveInfo
import graphene

from project.util.django_graphql_forms import DjangoFormMutation
from . import forms, models


class IssueArea(DjangoFormMutation):
    class Meta:
        form_class = forms.IssueAreaForm

    login_required = True

    session = graphene.Field('project.schema.SessionInfo')

    @classmethod
    def perform_mutate(cls, form: forms.IssueAreaForm, info: ResolveInfo):
        user = info.context.user
        area = form.cleaned_data['area']
        models.Issue.objects.set_area_issues_for_user(
            user, area, form.cleaned_data['issues'])
        models.CustomIssue.objects.set_for_user(
            user, area, form.cleaned_data['other'])
        return IssueArea(session='project.schema.SessionInfo')


class IssueMutations:
    issue_area = IssueArea.Field(required=True)


class CustomIssue(graphene.ObjectType):
    area = graphene.String(required=True)

    description = graphene.String(required=True)


class IssueSessionInfo:
    issues = graphene.List(graphene.NonNull(graphene.String), required=True)

    custom_issues = graphene.List(graphene.NonNull(CustomIssue), required=True)

    def resolve_issues(self, info: ResolveInfo) -> List[str]:
        user = info.context.user
        if not user.is_authenticated:
            return []
        return [issue.value for issue in user.issues.all()]

    def resolve_custom_issues(self, info: ResolveInfo) -> List[CustomIssue]:
        user = info.context.user
        if not user.is_authenticated:
            return []
        return [
            CustomIssue(area=ci.area, description=ci.description)
            for ci in user.custom_issues.all()
        ]
