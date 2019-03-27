from typing import List
from django.db import models, transaction
from django.core.exceptions import ValidationError

from users.models import JustfixUser
from project.common_data import Choices
from project.util.instance_change_tracker import InstanceChangeTracker


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


class IssueManager(models.Manager):
    @transaction.atomic
    def set_area_issues_for_user(self, user: JustfixUser, area: str, issues: List[str]):
        issues_set = set(issues)  # Remove duplicates and make lookup fast.
        curr_models = list(self.filter(user=user, area=area))
        models_to_delete = [model for model in curr_models if model.value not in issues_set]
        for model in models_to_delete:
            model.delete()
        values_that_already_exist = set(
            model.value
            for model in curr_models if model.value in issues_set
        )
        models_to_create = [
            Issue(user=user, area=area, value=value)
            for value in issues_set
            if value not in values_that_already_exist
        ]
        for model in models_to_create:
            model.full_clean()
            model.save()

    def get_area_issues_for_user(self, user: JustfixUser, area: str) -> List[str]:
        return [
            issue.value for issue in self.filter(user=user, area=area)
        ]


class Issue(models.Model):
    class Meta:
        unique_together = ('user', 'value')
        ordering = ("value",)

    created_at = models.DateTimeField(auto_now_add=True, null=True)

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

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.__immutable_field_tracker = InstanceChangeTracker(self, ['area', 'value'])

    def clean(self):
        ensure_issue_matches_area(self.value, self.area)

    def save(self, *args, **kwargs):
        assert not self.__immutable_field_tracker.has_changed()
        super().save(*args, **kwargs)


class CustomIssueManager(models.Manager):
    @transaction.atomic
    def set_for_user(self, user: JustfixUser, area: str, description: str):
        description = description.strip()
        issue = self.filter(user=user, area=area).first()
        if description:
            if issue is None:
                issue = CustomIssue(user=user, area=area)
            elif issue.description == description:
                return
            issue.description = description
            issue.full_clean()
            issue.save()
        elif issue:
            issue.delete()

    def get_for_user(self, user: JustfixUser, area: str) -> str:
        issues = self.filter(user=user, area=area).all()
        if len(issues) == 0:
            return ''
        return issues[0].description


class CustomIssue(models.Model):
    class Meta:
        unique_together = ('user', 'area')

    created_at = models.DateTimeField(auto_now_add=True, null=True)

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

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.__immutable_field_tracker = InstanceChangeTracker(self, ['area'])

    def save(self, *args, **kwargs):
        assert not self.__immutable_field_tracker.has_changed()
        super().save(*args, **kwargs)
