import abc
import time
from typing import Iterable
from django.utils import translation

from users.models import JustfixUser
from .models import Reminder, REMINDERS, exclude_users_with_invalid_phone_numbers
from project.util.progress_bar import cli_progress_bar


class SmsReminder(abc.ABC):
    reminder_kind: str = ""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run

    @abc.abstractmethod
    def filter_user_queryset(self, queryset):
        pass

    @abc.abstractmethod
    def get_sms_text(self, user: JustfixUser) -> str:
        pass

    def get_queryset(self) -> Iterable[JustfixUser]:
        users = JustfixUser.objects.filter(onboarding_info__can_we_sms=True)
        users = exclude_users_with_invalid_phone_numbers(users)
        users = self.filter_user_queryset(users).exclude(reminders__kind=self.reminder_kind)
        return users

    def remind_users(self, seconds_between_texts: float = 0.0):
        SmsReminder.validate(self)
        users = self.get_queryset()

        for user in cli_progress_bar(users, prefix="Progress:", suffix="Complete", length=50):
            with translation.override(user.locale):
                text = self.get_sms_text(user)
                assert text
                extra = f" with the text {repr(text)}" if self.dry_run else ""
                print(f"Sending a {self.reminder_kind} reminder to {user.username}{extra}.")
                if not self.dry_run:
                    send_result = user.send_sms(text)
                    Reminder.objects.try_to_create_from_send_sms_result(
                        send_result,
                        kind=self.reminder_kind,
                        user=user,
                    )
                    if send_result.sid:
                        # The message send was successful, let's wait so we don't overload
                        # Twilio's SMS queue.
                        time.sleep(seconds_between_texts)

    @staticmethod
    def validate(instance: "SmsReminder"):
        """
        Validate that the SmsReminder is configured properly.
        """

        assert instance.reminder_kind, "reminder_kind must be set"
        REMINDERS.validate_choices(instance.reminder_kind)
