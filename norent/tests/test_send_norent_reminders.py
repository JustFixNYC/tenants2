import pytest
from django.core.management import call_command

from onboarding.tests.factories import OnboardingInfoFactory
from norent.tests.factories import RentPeriodFactory, LetterFactory


class TestSendNorentReminders:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, use_norent_site):
        self.rp = RentPeriodFactory.from_iso("2020-11-01")
        self.user = OnboardingInfoFactory(state="CA").user

    def test_it_does_not_send_if_user_sent_letter_for_month(self, smsoutbox):
        LetterFactory(user=self.user, rent_period=self.rp)
        call_command("send_norent_reminders", "2020-11")
        assert len(smsoutbox) == 0

    def test_it_does_not_send_if_user_is_not_from_ca(self, smsoutbox):
        onb = self.user.onboarding_info
        onb.state = "IL"
        onb.save()
        call_command("send_norent_reminders", "2020-11")
        assert len(smsoutbox) == 0

    def test_it_sends_if_user_never_sent_letter(self, smsoutbox):
        call_command("send_norent_reminders", "2020-11")
        assert len(smsoutbox) == 1

        # Make sure it doesn't send twice.
        smsoutbox[:] = []
        call_command("send_norent_reminders", "2020-11")
        assert len(smsoutbox) == 0

    def test_it_sends_if_user_sent_letter_for_different_month(self, smsoutbox):
        LetterFactory(user=self.user)
        call_command("send_norent_reminders", "2020-11")
        assert len(smsoutbox) == 1
        assert "Boop" in smsoutbox[0].body
        assert "https://example.com/" in smsoutbox[0].body
