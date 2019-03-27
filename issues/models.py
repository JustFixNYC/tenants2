import json
from typing import List, Optional
from enum import Enum
from django.db import models, transaction
from django.core.exceptions import ValidationError
from django.core import serializers
from django.contrib.postgres.fields import JSONField
import pydantic

from users.models import JustfixUser
from project.common_data import Choices


ISSUE_AREA_CHOICES = Choices.from_file('issue-area-choices.json')

ISSUE_CHOICES = Choices.from_file('issue-choices.json')

VALUE_MAXLEN = 60


def ensure_issue_matches_area(issue: str, area: str):
    if get_issue_area(issue) != area:
        raise ValidationError(f'Issue {issue} does not match area {area}')


def get_issue_area(value: str) -> str:
    '''
    Issue values consist of their area value followed by two underscores
    followed by their issue-specific value. This function retrieves the
    area value, e.g.:

        >>> get_issue_area('HOME__MICE')
        'HOME'
    '''

    return value.split('__')[0]


def queryset_to_json(queryset):
    return json.loads(serializers.serialize("json", queryset))


class Event(pydantic.BaseModel):
    class Config:
        use_enum_values = True


class IssuesChangedEvent(Event):
    added: List[str]
    removed: List[str]


class CustomIssueEventType(Enum):
    added = 'added'
    removed = 'removed'
    changed = 'changed'


class CustomIssueEvent(Event):
    kind: CustomIssueEventType
    area: str
    description: Optional[str]


class IssueEvent(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE)
    kind = models.CharField(max_length=100)
    data = JSONField()

    @staticmethod
    def create(user: JustfixUser, event: Event) -> 'IssueEvent':
        return IssueEvent(
            user=user,
            kind=event.__class__.__name__,
            data=event.dict()
        )


class IssueManager(models.Manager):
    @transaction.atomic
    def set_area_issues_for_user(self, user: JustfixUser, area: str, issues: List[str]):
        issues = list(set(issues))  # Remove duplicates.
        curr_models = self.filter(user=user, area=area)
        models_to_delete = curr_models.exclude(value__in=issues)
        values_to_remove = [
            model['value']
            for model in models_to_delete.values('value')
        ]
        if values_to_remove:
            models_to_delete.delete()
        values_to_ignore = set(
            model['value']
            for model in curr_models.filter(value__in=issues).values('value')
        )
        models_to_create = [
            Issue(user=user, area=area, value=value)
            for value in issues
            if value not in values_to_ignore
        ]
        values_to_add = [model.value for model in models_to_create]
        for model in models_to_create:
            model.full_clean()
        self.bulk_create(models_to_create)
        if values_to_remove or values_to_add:
            event = IssuesChangedEvent(added=values_to_add, removed=values_to_remove)
            IssueEvent.create(user=user, event=event).save()

    def get_area_issues_for_user(self, user: JustfixUser, area: str) -> List[str]:
        return [
            issue.value for issue in self.filter(user=user, area=area)
        ]


class Issue(models.Model):
    class Meta:
        unique_together = ('user', 'value')
        ordering = ("value",)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='issues',
        help_text="The user reporting the issue.")

    area = models.CharField(
        max_length=VALUE_MAXLEN, choices=ISSUE_AREA_CHOICES.choices,
        help_text="The area this issue belongs to.")

    value = models.CharField(
        max_length=VALUE_MAXLEN, choices=ISSUE_CHOICES.choices,
        help_text="The issue the user has reported.")

    objects = IssueManager()

    def clean(self):
        ensure_issue_matches_area(self.value, self.area)


class CustomIssueManager(models.Manager):
    @transaction.atomic
    def set_for_user(self, user: JustfixUser, area: str, description: str):
        description = description.strip()
        issue = self.filter(user=user, area=area).first()
        if description:
            if issue is None:
                issue = CustomIssue(user=user, area=area)
                kind = CustomIssueEventType.added
            elif issue.description != description:
                kind = CustomIssueEventType.changed
            else:
                return
            event = CustomIssueEvent(kind=kind, area=area, description=description)
            IssueEvent.create(user=user, event=event)
            issue.description = description
            issue.full_clean()
            issue.save()
        elif issue:
            IssueEvent.create(user=user, event=CustomIssueEvent(
                kind=CustomIssueEventType.removed,
                area=area
            )).save()
            issue.delete()

    def get_for_user(self, user: JustfixUser, area: str) -> str:
        issues = self.filter(user=user, area=area).all()
        if len(issues) == 0:
            return ''
        return issues[0].description


class CustomIssue(models.Model):
    class Meta:
        unique_together = ('user', 'area')

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='custom_issues',
        help_text="The user reporting the custom issue.")

    area = models.CharField(
        max_length=VALUE_MAXLEN, choices=ISSUE_AREA_CHOICES.choices,
        help_text="The area this custom issue belongs to.")

    description = models.TextField(
        help_text="The description of this custom issue."
        )

    objects = CustomIssueManager()
