from typing import Any, Dict
import pytest
import json
from gceletter.tests.sample_data import SAMPLE_POST_DATA

from gceletter.models import GCELetter


def base_headers(settings):
    return {
        "HTTP_AUTHORIZATION": f"Bearer {settings.GCE_API_TOKEN}",
        "content_type": "application/json",
    }


def authorized_request(client, settings, post_data, **kawrgs):
    return client.post(
        "/gceletter/send-letter",
        json.dumps(post_data),
        HTTP_ORIGIN=settings.GCE_ORIGIN,
        **base_headers(settings),
        **kawrgs,
    )


def get_letter_by_phone(phone_number):
    return GCELetter.objects.get(user_details__phone_number=phone_number)


@pytest.mark.django_db
def test_unauthorized_request_fails(client, settings):
    res = client.post("/gceletter/send-letter", HTTP_ORIGIN=settings.GCE_ORIGIN)
    assert res.status_code == 401
    assert res.json()["error"] == "Unauthorized request"


@pytest.mark.django_db
def test_post_creates_record(client, settings):
    res = authorized_request(client, settings, SAMPLE_POST_DATA)
    assert res.status_code == 200
    assert res["Content-Type"] == "application/json"
    phone_number = SAMPLE_POST_DATA["user_details"]["phone_number"]
    letter = get_letter_by_phone(phone_number)
    assert letter.mail_choice == SAMPLE_POST_DATA["mail_choice"]
    assert letter.user_details.first_name == SAMPLE_POST_DATA["user_details"]["first_name"]
    assert letter.landlord_details.name == SAMPLE_POST_DATA["landlord_details"]["name"]


@pytest.mark.django_db
def test_default_errors_response(client, settings):
    res = authorized_request(client, settings, SAMPLE_POST_DATA)
    assert res.status_code == 200
    errors = res.json()["errors"]
    assert errors["landlord_email"]["error"] is False
    assert errors["user_email"]["error"] is False
    assert errors["textit_campaign"]["error"] is False
    # TODO: getting lob test error "No mock address: POST https://api.lob.com/v1/us_verifications"
    assert errors["letter_mail"]["error"] is True


@pytest.mark.django_db
def test_skipped_send_subtasks_response(client, settings):
    post_data: Dict[str, Any] = {
        **SAMPLE_POST_DATA,
        "email_to_landlord": False,
        "mail_choice": "USER_WILL_MAIL",
    }
    post_data["user_details"]["email"] = None
    res = authorized_request(client, settings, post_data)
    errors = res.json()["errors"]
    assert "landlord_email" not in errors
    assert "letter_mail" not in errors
    assert "user_email" not in errors
