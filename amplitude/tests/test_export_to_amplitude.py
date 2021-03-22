from django.core.management import call_command, CommandError
from django.utils.timezone import now
import pytest

from onboarding.tests.factories import OnboardingInfoFactory
from evictionfree.tests.factories import SubmittedHardshipDeclarationFactory
from amplitude.management.commands.export_to_amplitude import EfnySynchronizer
from amplitude.api import AMP_BATCH_URL, EPOCH
from amplitude import models


def test_it_does_nothing_in_dry_run(db, settings, requests_mock):
    settings.AMPLITUDE_API_KEY = "blop"
    OnboardingInfoFactory()
    mock = requests_mock.post(AMP_BATCH_URL)

    call_command("export_to_amplitude", "--dry-run")

    assert mock.call_count == 0
    for sync in models.Sync.objects.all():
        assert sync.last_synced_at == EPOCH


def test_it_syncs_user_properties(db, settings, requests_mock):
    settings.AMPLITUDE_API_KEY = "blop"
    onb = OnboardingInfoFactory(can_we_sms=False)
    onb.user.date_joined = EPOCH
    onb.user.save()
    uid = onb.user.pk
    mock = requests_mock.post(AMP_BATCH_URL)
    when = now()
    call_command("export_to_amplitude")
    assert mock.call_count == 1
    payload = mock.last_request.json()
    assert payload["api_key"] == "blop"
    assert len(payload["events"]) == 1
    event = payload["events"][0]
    assert event["event_type"] == "User data updated from server"
    assert event["user_id"] == f"justfix:{uid}"
    assert event["user_properties"] == {
        "adminUrl": f"https://example.com/admin/users/justfixuser/{uid}/change/",
        "canHj4aSms": False,
        "canRtcSms": False,
        "canWeSms": False,
        "hasEmail": False,
        "lastLogin": None,
        "dateJoined": "1970-01-01T00:00:00+00:00",
        "city": "Brooklyn",
        "isEmailVerified": False,
        "leaseType": "RENT_STABILIZED",
        "signupIntent": "LOC",
        "state": "NY",
        "agreedToEvictionfreeTerms": False,
        "agreedToJustfixTerms": True,
        "agreedToNorentTerms": False,
        "canReceiveRttcComms": None,
        "canReceiveSajeComms": None,
        "hasAptNumber": True,
        "hasCalled311": False,
        "receivesPublicAssistance": False,
        "zipcode": "",
    }
    s = models.Sync.objects.get(kind=models.SYNC_CHOICES.USERS_V2)
    assert s.last_synced_at >= when


class TestEfnySynchronizer:
    def test_it_only_processes_fully_processed_decls(self, db):
        SubmittedHardshipDeclarationFactory(fully_processed_at=None)
        assert len(list(EfnySynchronizer().iter_events(EPOCH))) == 0

    def test_it_works(self, db):
        shd = SubmittedHardshipDeclarationFactory(
            fully_processed_at=EPOCH,
            mailed_at=EPOCH,
        )
        events = list(EfnySynchronizer().iter_events(EPOCH))
        assert len(events) == 1
        event = events[0]
        assert event.event_type == "Submitted EvictionFree declaration"
        assert event.event_properties == {
            "wasEmailed": False,
            "locale": "en",
            "wasMailed": True,
            "hasFinancialHardship": True,
            "hasHealthRisk": False,
        }
        assert event.time == shd.created_at


def test_it_raises_error_when_amplitude_is_disabled():
    with pytest.raises(CommandError, match="AMPLITUDE_API_KEY must be configured"):
        call_command("export_to_amplitude")
