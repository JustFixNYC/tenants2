from django.db import models

from users.models import JustfixUser
from project.common_data import Choices


ISSUE_AREA_CHOICES = Choices.from_file('issue-area-choices.json')

ISSUE_CHOICES = Choices.from_file('issue-choices.json')

VALUE_MAXLEN = 30


def get_issue_area(value: str) -> str:
    '''
    Issue values consist of their area value followed by two underscores
    followed by their issue-specific value. This function retrieves the
    area value, e.g.:

        >>> get_issue_area('HOME__MICE')
        'HOME'
    '''

    return value.split('__')[0]


class Issue(models.Model):
    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE, related_name='issues')

    area = models.CharField(max_length=VALUE_MAXLEN, choices=ISSUE_AREA_CHOICES.choices)

    value = models.CharField(max_length=VALUE_MAXLEN, choices=ISSUE_CHOICES.choices)

    def save(self, *args, **kwargs):
        if get_issue_area(self.value) != self.area:
            raise ValueError(f'Issue {self.value} does not match area {self.area}')
        super().save(*args, **kwargs)
