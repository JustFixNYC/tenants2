from django.core.management import call_command, CommandError
from django.utils.timezone import now
import pytest

from onboarding.tests.factories import OnboardingInfoFactory
from amplitude.management.commands.export_to_amplitude import AMP_BATCH_URL
from amplitude import models


def test_it_works(db, settings, requests_mock):
    settings.AMPLITUDE_API_KEY = "blop"
    onb = OnboardingInfoFactory(can_we_sms=False)
    uid = onb.user.pk
    mock = requests_mock.post(AMP_BATCH_URL)
    when = now()
    call_command("export_to_amplitude")
    assert mock.call_count == 1
    payload = mock.last_request.json()
    assert payload["api_key"] == "blop"
    assert len(payload["events"]) == 1

    # TODO: This is stupidly verbose
    assert payload["events"][0] == {
        "event_type": "$identify",
        "user_id": f"justfix:{uid}",
        "user_properties": {
            "adminUrl": f"https://example.com/admin/users/justfixuser/{uid}/change/",
            "canHj4aSms": False,
            "canRtcSms": False,
            "canWeSms": False,
            "hasEmail": False,
        },
    }
    s = models.Sync.objects.get(kind=models.SYNC_CHOICES.USERS)
    assert s.last_synced_at >= when


def test_it_raises_error_when_amplitude_is_disabled():
    with pytest.raises(CommandError, match="AMPLITUDE_API_KEY must be configured"):
        call_command("export_to_amplitude")
