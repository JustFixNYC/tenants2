import json
from unittest.mock import MagicMock

from rh.dhcr_portal_submit import SubmissionResult, submit_via_portal
from rh.models import RentalHistoryRequest
from rh.tests.factories import RentalHistoryRequestFactory

VALID_PAYLOAD = {
    "first_name": "Daniel",
    "last_name": "Defoe",
    "apartment_number": "1",
    "phone_number": "2125551234",
    "address": "77 Sands St",
    "borough": "BROOKLYN",
}


def _post(client, payload):
    return client.post(
        "/rh/submit",
        data=json.dumps(payload),
        content_type="application/json",
    )


def test_requests_returns_local_requests_when_debug_is_enabled(db, client, settings):
    settings.DEBUG = True
    RentalHistoryRequestFactory(
        user=None,
        first_name="Older",
        last_name="Tenant",
        address="1 Old St",
        dhcr_reference_number="260518-000001",
    )
    newer = RentalHistoryRequestFactory(
        user=None,
        first_name="Newer",
        last_name="Tenant",
        address="2 New St",
        dhcr_reference_number="260518-000002",
    )

    res = client.get("/rh/requests")

    assert res.status_code == 200
    data = res.json()
    assert len(data["results"]) == 2
    assert data["results"][0]["id"] == newer.pk
    assert data["results"][0]["first_name"] == "Newer"
    assert data["results"][0]["dhcr_reference_number"] == "260518-000002"
    assert data["results"][0]["phone_number"] == newer.phone_number


def test_requests_404s_when_debug_is_disabled(db, client, settings):
    settings.DEBUG = False
    settings.SECURE_SSL_REDIRECT = False

    res = client.get("/rh/requests")

    assert res.status_code == 404


def test_missing_required_field_returns_400_and_saves_nothing(db, client):
    payload = {k: v for k, v in VALID_PAYLOAD.items() if k != "first_name"}
    res = _post(client, payload)
    assert res.status_code == 400
    assert "first_name" in res.json()["errors"]
    assert RentalHistoryRequest.objects.count() == 0


def test_valid_payload_creates_request_and_returns_201(db, client, monkeypatch):
    portal = MagicMock(
        return_value=SubmissionResult(success=False, dry_run=True, reference_number=None)
    )
    monkeypatch.setattr("rh.views.submit_via_portal", portal)

    res = _post(client, VALID_PAYLOAD)

    assert res.status_code == 201
    rhr = RentalHistoryRequest.objects.get()
    assert rhr.first_name == "Daniel"
    assert rhr.last_name == "Defoe"
    assert rhr.address == "77 Sands St"
    assert rhr.borough == "BROOKLYN"
    assert res.json() == {
        "id": rhr.pk,
        "portal": {
            "dry_run": True,
            "success": False,
            "reference_number": None,
            "error": None,
        },
    }


def test_valid_payload_calls_portal_with_saved_request(db, client, monkeypatch):
    portal = MagicMock(return_value=SubmissionResult(success=False, dry_run=True))
    monkeypatch.setattr("rh.views.submit_via_portal", portal)

    _post(client, VALID_PAYLOAD)

    portal.assert_called_once()
    rhr = RentalHistoryRequest.objects.get()
    assert portal.call_args.args[0].pk == rhr.pk


def test_valid_payload_saves_portal_reference_number(db, client, monkeypatch):
    portal = MagicMock(
        return_value=SubmissionResult(success=True, dry_run=False, reference_number="260518-000018")
    )
    monkeypatch.setattr("rh.views.submit_via_portal", portal)

    res = _post(client, VALID_PAYLOAD)

    assert res.status_code == 201
    assert res.json()["portal"]["reference_number"] == "260518-000018"
    rhr = RentalHistoryRequest.objects.get()
    assert rhr.dhcr_reference_number == "260518-000018"


def test_portal_returns_error_when_browser_launch_fails(db, monkeypatch):
    """A browser launch failure must be captured in the result, never raised.

    Regression for the 500 seen when the container has Playwright but no
    Chromium binary: `BrowserType.launch: Executable doesn't exist ...`.
    """

    class _FakeChromium:
        def launch(self, **kwargs):
            raise RuntimeError("Executable doesn't exist at .../chrome")

    class _FakePW:
        chromium = _FakeChromium()

    class _FakeCM:
        def __enter__(self):
            return _FakePW()

        def __exit__(self, *exc):
            return False

    monkeypatch.setattr("playwright.sync_api.sync_playwright", lambda: _FakeCM())

    rhr = RentalHistoryRequestFactory()
    result = submit_via_portal(rhr)  # must not raise

    assert result.success is False
    assert result.error is not None
    assert "Executable doesn't exist" in result.error


def test_extract_reference_number_parses_success_text():
    from rh.dhcr_portal_submit import _extract_reference_number

    text = "Your question has been submitted. Reference number: #260518-000018."
    assert _extract_reference_number(text) == "260518-000018"
    assert _extract_reference_number("no number here") is None
