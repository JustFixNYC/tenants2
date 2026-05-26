import json

import pytest
from django.urls import reverse

from rh.models import RentalHistoryRequest


VALID_RH_API_DATA = {
    "email": "user@justfix.org",
    "first_name": "john",
    "last_name": "doe",
    "phone": "2125551234",
    "street": "150 court st",
    "apt": "2",
    "city": "brooklyn",
    "zip": "11201",
}


def post_json(client, data):
    return client.post(
        reverse("rh:submit_rent_history_request"),
        json.dumps(data),
        content_type="application/json",
    )


@pytest.mark.django_db
def test_submit_rent_history_request_returns_and_saves_reference_number(client, monkeypatch):
    submitted = []

    def mock_submit(data):
        submitted.append(data)
        return "250526-123456"

    monkeypatch.setattr("rh.dhcr.submit_rent_history_request", mock_submit)

    res = post_json(client, VALID_RH_API_DATA)

    assert res.status_code == 201
    assert res.json() == {"reference_number": "250526-123456"}
    assert len(submitted) == 1
    assert submitted[0].email == "user@justfix.org"
    assert submitted[0].street == "150 court st"

    rhr = RentalHistoryRequest.objects.get()
    assert rhr.first_name == "john"
    assert rhr.last_name == "doe"
    assert rhr.phone_number == "2125551234"
    assert rhr.address == "150 court st"
    assert rhr.apartment_number == "2"
    assert rhr.borough == "BROOKLYN"
    assert rhr.zipcode == "11201"
    assert rhr.dhcr_reference_number == "250526-123456"


@pytest.mark.django_db
def test_submit_rent_history_request_accepts_user_data_wrapper(client, monkeypatch):
    monkeypatch.setattr("rh.dhcr.submit_rent_history_request", lambda data: "250526-ABCDEF")

    res = post_json(client, {"user_data": VALID_RH_API_DATA})

    assert res.status_code == 201
    assert res.json() == {"reference_number": "250526-ABCDEF"}


@pytest.mark.django_db
def test_submit_rent_history_request_rejects_invalid_data(client, monkeypatch):
    def fail_if_called(data):
        raise AssertionError("DHCR submitter should not be called")

    monkeypatch.setattr("rh.dhcr.submit_rent_history_request", fail_if_called)

    res = post_json(client, {**VALID_RH_API_DATA, "phone": "123", "city": "hoboken"})

    assert res.status_code == 400
    assert res.json()["error"] == "Invalid POST data"
    assert RentalHistoryRequest.objects.count() == 0


@pytest.mark.django_db
def test_submit_rent_history_request_handles_dhcr_submission_failure(client, monkeypatch):
    from rh.dhcr import DhcrSubmissionError

    def mock_submit(data):
        raise DhcrSubmissionError("DHCR did not return a reference number.")

    monkeypatch.setattr("rh.dhcr.submit_rent_history_request", mock_submit)

    res = post_json(client, VALID_RH_API_DATA)

    assert res.status_code == 502
    assert res.json() == {
        "error": "DHCR submission failed",
        "details": "DHCR did not return a reference number.",
    }
    assert RentalHistoryRequest.objects.count() == 0
