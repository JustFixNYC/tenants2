import abc
from django.utils import translation
from django.utils import timezone

from users.models import JustfixUser
from .models import Reminder, REMINDERS, exclude_users_with_invalid_phone_numbers


class SmsReminder(abc.ABC):
    reminder_kind: str = ''

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run

    @abc.abstractmethod
    def filter_user_queryset(self, queryset):
        pass

    @abc.abstractmethod
    def get_sms_text(self, user: JustfixUser) -> str:
        pass

    def get_queryset(self):
        users = JustfixUser.objects.filter(onboarding_info__can_we_sms=True)
        users = exclude_users_with_invalid_phone_numbers(users)
        users = self.filter_user_queryset(users)\
            .exclude(reminders__kind=self.reminder_kind)
        return users

    def remind_users(self):
        SmsReminder.validate(self)
        users = self.get_queryset()

        for user in users:
            with translation.override(user.locale):
                text = self.get_sms_text(user)
                assert text
                print(f'Sending a {self.reminder_kind} reminder to {user.username}.')
                sid = '' if self.dry_run else user.send_sms(text)
                if sid:
                    Reminder(
                        kind=self.reminder_kind,
                        sent_at=timezone.now(),
                        user=user,
                        sid=sid,
                    ).save()

    @staticmethod
    def validate(instance: 'SmsReminder'):
        '''
        Validate that the SmsReminder is configured properly.
        '''

        assert instance.reminder_kind, "reminder_kind must be set"
        REMINDERS.validate_choices(instance.reminder_kind)
