from django.core.management import call_command
from freezegun import freeze_time

from onboarding.tests.factories import OnboardingInfoFactory
from loc.tests.factories import LetterRequestFactory
from texting.models import Reminder


def test_loc_reminder_is_not_sent_when_not_enough_time_has_passed(db, smsoutbox):
    with freeze_time("2018-01-01"):
        OnboardingInfoFactory()
    with freeze_time("2018-01-02"):
        call_command("sendreminders")

    assert len(smsoutbox) == 0
    assert Reminder.objects.count() == 0


def test_loc_reminder_is_not_sent_when_loc_exists(db, smsoutbox):
    with freeze_time("2018-01-01"):
        info = OnboardingInfoFactory()
        LetterRequestFactory(user=info.user)
    with freeze_time("2018-05-04"):
        call_command("sendreminders")

    assert len(smsoutbox) == 0
    assert Reminder.objects.count() == 0


def test_loc_reminder_is_not_sent_when_signup_intent_is_not_loc(db, smsoutbox):
    with freeze_time("2018-01-01"):
        OnboardingInfoFactory(signup_intent="HP")
    with freeze_time("2018-05-04"):
        call_command("sendreminders")

    assert len(smsoutbox) == 0
    assert Reminder.objects.count() == 0


def test_loc_reminder_is_sent_when_needed(db, smsoutbox):
    with freeze_time("2018-01-01"):
        OnboardingInfoFactory(signup_intent="LOC")
    with freeze_time("2018-05-04"):
        call_command("sendreminders")

    assert len(smsoutbox) == 1
    msg = smsoutbox[0]
    assert msg.to == "+15551234567"
    assert msg.body == (
        "Hey Bip! Don't forget that you can use JustFix.nyc "
        "to address repair issues in your apartment. "
        "Follow this link to continue: https://example.com/"
    )

    reminder = Reminder.objects.get(sid=msg.sid)
    assert reminder.kind == "LOC"
    assert reminder.user.first_name == "Boop"

    # Now ensure the message isn't sent again the next day.
    smsoutbox[:] = []
    with freeze_time("2018-05-05"):
        call_command("sendreminders")
    assert len(smsoutbox) == 0
