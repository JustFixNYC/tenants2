import datetime
from django.db import models
from django.utils import timezone

from users.models import JustfixUser
from project.common_data import Choices


REMINDERS = Choices([
    ('LOC', 'Letter of complaint reminder'),
])


class Reminder(models.Model):
    '''
    This model represents a reminder sent to users.
    '''

    kind = models.TextField(max_length=30, choices=REMINDERS.choices)

    sent_at = models.DateField()

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='reminders')


# After these many days have passed since the user
# signed up, we will send them a reminder, unless they
# have completed the LoC process.
DAYS_UNTIL_LOC_REMINDER = 3


def get_users_to_remind_about_loc():
    days_ago = timezone.now() - datetime.timedelta(days=DAYS_UNTIL_LOC_REMINDER)
    return JustfixUser.objects.filter(
        date_joined__lte=days_ago,
        onboarding_info__can_we_sms=True,
        letter_request__isnull=True,
    ).exclude(
        reminders__kind=REMINDERS.LOC
    )


def remind_user_about_loc(user):
    # TODO: Send SMS.
    Reminder(
        kind=REMINDERS.LOC,
        sent_at=timezone.now(),
        user=user
    ).save()
