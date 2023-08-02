import datetime
import os
from django.utils import timezone

from project.util.site_util import absolutify_url
from texting.models import REMINDERS
from texting.sms_reminder import SmsReminder
from onboarding.models import SIGNUP_INTENT_CHOICES


# After these many days have passed since the user
# signed up, we will send them a reminder, unless they
# have completed the LoC process.
DAYS_UNTIL_LOC_REMINDER = 3


class LocReminder(SmsReminder):
    reminder_kind = REMINDERS.LOC

    def filter_user_queryset(self, qs):
        days_ago = timezone.now() - datetime.timedelta(days=DAYS_UNTIL_LOC_REMINDER)
        return qs.filter(
            date_joined__lte=days_ago,
            onboarding_info__signup_intent=SIGNUP_INTENT_CHOICES.LOC,
            letter_request__isnull=True,
        )

    def get_sms_text(self, user):
        url = absolutify_url("/loc/issues")
        return (
            f"You started a Letter of Complaint about repair issues in your home. "
            f"Complete your letter and we’ll mail it to your landlord for free. "
            f"{os.linesep}"
            f"Log in: {url}"
        )


SmsReminder.validate(LocReminder())
