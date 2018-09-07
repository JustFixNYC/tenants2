from typing import List
from django.db import models
from django.core.exceptions import ValidationError

from users.models import JustfixUser
from project.common_data import Choices


ISSUE_AREA_CHOICES = Choices.from_file('issue-area-choices.json')

ISSUE_CHOICES = Choices.from_file('issue-choices.json')

VALUE_MAXLEN = 30


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
    def set_area_issues_for_user(self, user: JustfixUser, area: str, issues: List[str]):
        issues = list(set(issues))  # Remove duplicates.
        self.filter(user=user, area=area).delete()
        models = [
            Issue(user=user, area=area, value=value)
            for value in issues
        ]
        for model in models:
            model.full_clean()
        self.bulk_create(models)

    def get_area_issues_for_user(self, user: JustfixUser, area: str) -> List[str]:
        return [
            issue.value for issue in self.filter(user=user, area=area)
        ]


class Issue(models.Model):
    class Meta:
        unique_together = ('user', 'value')

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
    def set_for_user(self, user: JustfixUser, area: str, description: str):
        self.filter(user=user, area=area).delete()
        description = description.strip()
        if description:
            issue = CustomIssue(user=user, area=area, description=description)
            issue.full_clean()
            issue.save()

    def get_for_user(self, user: JustfixUser, area: str) -> str:
        issues = self.filter(user=user, area=area).all()
        if len(issues) == 0:
            return ''
        return issues[0].description


class CustomIssue(models.Model):
    class Meta:
        unique_together = ('user', 'area')

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
