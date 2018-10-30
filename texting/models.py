import datetime
from django.db import models
from django.utils import timezone

from users.models import JustfixUser
from project.common_data import Choices
from project.util.site_util import absolutify_url

# https://support.twilio.com/hc/en-us/articles/223134387-What-is-a-Message-SID-
TWILIO_SID_LENGTH = 34

REMINDERS = Choices([
    ('LOC', 'Letter of complaint reminder'),
])


class Reminder(models.Model):
    '''
    This model represents a reminder sent to users.
    '''

    kind = models.TextField(
        max_length=30, choices=REMINDERS.choices,
        help_text="The type of reminder sent."
    )

    sent_at = models.DateField(
        help_text="When the reminder was sent."
    )

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='reminders',
        help_text="The user the reminder was sent to."
    )

    sid = models.CharField(
        max_length=TWILIO_SID_LENGTH,
        help_text="The Twilio Message SID for the reminder."
    )


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
    url = absolutify_url('/')
    sid = user.send_sms(
        f'Hey {user.first_name}! '
        f'Don\'t forget that you can use JustFix.nyc to address '
        f'repair issues in your apartment. '
        f'Follow this link to continue: {url}'
    )
    if sid:
        Reminder(
            kind=REMINDERS.LOC,
            sent_at=timezone.now(),
            user=user,
            sid=sid
        ).save()
