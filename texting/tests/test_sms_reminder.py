import pytest
from django.utils.translation import gettext as _

from onboarding.tests.factories import OnboardingInfoFactory
from users.tests.factories import SecondUserFactory
from texting.models import PhoneNumberLookup
from texting.sms_reminder import SmsReminder


class RemindBoops(SmsReminder):
    '''Remind users named Boop.'''

    reminder_kind = 'LOC'

    def filter_user_queryset(self, queryset):
        return queryset.filter(first_name='Boop')

    def get_sms_text(self, user):
        return _("Hello world") + " " + user.full_name


class TestSmsReminder:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, smsoutbox):
        self.smsoutbox = smsoutbox

    def test_it_ignores_users_with_invalid_numbers(self):
        user = OnboardingInfoFactory().user
        r = RemindBoops()
        assert r.get_queryset().count() == 1

        pl = PhoneNumberLookup(phone_number=user.phone_number, is_valid=False)
        pl.save()
        assert r.get_queryset().count() == 0

    def test_it_filters_out_users(self):
        OnboardingInfoFactory(user=SecondUserFactory())
        RemindBoops().remind_users()
        assert len(self.smsoutbox) == 0

    def test_it_does_not_send_message_twice(self):
        OnboardingInfoFactory()
        RemindBoops().remind_users()
        assert len(self.smsoutbox) == 1
        self.smsoutbox[:] = []
        RemindBoops().remind_users()
        assert len(self.smsoutbox) == 0

    def test_it_sends_message(self):
        OnboardingInfoFactory()
        RemindBoops().remind_users()
        assert len(self.smsoutbox) == 1
        assert self.smsoutbox[0].body == "Hello world Boop Jones"

    def test_it_sets_user_locale(self):
        OnboardingInfoFactory(user__locale="es")
        RemindBoops().remind_users()
        assert len(self.smsoutbox) == 1
        assert self.smsoutbox[0].body == "Hola mundo Boop Jones"

    def test_it_ignores_users_we_cannot_sms(self):
        OnboardingInfoFactory(can_we_sms=False)
        RemindBoops().remind_users()
        assert len(self.smsoutbox) == 0
