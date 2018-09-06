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
        models.Issue.objects.set_area_issues_for_user(
            user, form.cleaned_data['area'], form.cleaned_data['issues'])
        return IssueArea(session='project.schema.SessionInfo')


class IssueMutations:
    issue_area = IssueArea.Field(required=True)


class IssueSessionInfo:
    issues = graphene.List(graphene.NonNull(graphene.String), required=True)

    def resolve_issues(self, info: ResolveInfo) -> List[str]:
        user = info.context.user
        if not user.is_authenticated:
            return []
        return [issue.value for issue in user.issues.all()]
