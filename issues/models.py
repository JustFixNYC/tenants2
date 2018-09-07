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
    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE, related_name='issues')

    area = models.CharField(max_length=VALUE_MAXLEN, choices=ISSUE_AREA_CHOICES.choices)

    value = models.CharField(max_length=VALUE_MAXLEN, choices=ISSUE_CHOICES.choices)

    objects = IssueManager()

    def clean(self):
        ensure_issue_matches_area(self.value, self.area)
