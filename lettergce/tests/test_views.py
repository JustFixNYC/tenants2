import pytest
import json
from lettergce.tests.sample_data import SAMPLE_POST_DATA
from lettergce.models import LetterGCE


def base_headers(settings):
    return {
        "HTTP_AUTHORIZATION": f"Bearer {settings.GCE_API_TOKEN}",
        "content_type": "application/json",
    }


def authorized_request(client, settings, post_data, **kawrgs):
    return client.post(
        "/lettergce/send-letter",
        json.dumps(post_data),
        HTTP_ORIGIN=settings.GCE_ORIGIN,
        **base_headers(settings),
        **kawrgs,
    )


def get_letter_by_phone(phone_number):
    return LetterGCE.objects.get(user_details__phone_number=phone_number)


@pytest.mark.django_db
def test_unauthorized_request_fails(client, settings):
    res = client.post("/lettergce/send-letter", HTTP_ORIGIN=settings.GCE_ORIGIN)
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
