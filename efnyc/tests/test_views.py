import pytest
import json

from efnyc.models import EfnycPhoneNumber


def base_headers(settings):
    return {
        "HTTP_AUTHORIZATION": f"Bearer {settings.EFNYC_API_TOKEN}",
        "content_type": "application/json",
    }


VALID_PHONE_DATA = {
    "phone_number": "2125551234"
}

INVALID_PHONE_DATA = {
    "phone_number": "123"
}


def authorized_request(client, settings, post_data, **kwargs):
    return client.post(
        "/efnyc/upload",
        json.dumps(post_data),
        **base_headers(settings),
        **kwargs,
    )


def get_efnyc_record_by_id(id):
    return EfnycPhoneNumber.objects.get(id=id)


@pytest.mark.django_db
def test_upload_phone_number_success(client, settings):
    res = authorized_request(client, settings, VALID_PHONE_DATA)
    assert res.status_code == 200
    assert res["Content-Type"] == "application/json"
    data = res.json()
    assert "id" in data
    
    # Verify the record was created
    record = get_efnyc_record_by_id(data["id"])
    assert record.phone_number == "2125551234"


@pytest.mark.django_db
def test_upload_invalid_phone_number(client, settings):
    res = authorized_request(client, settings, INVALID_PHONE_DATA)
    assert res.status_code == 400
    data = res.json()
    assert data["error"] == "Invalid POST data"


@pytest.mark.django_db
def test_upload_unauthorized(client, settings):
    # Test upload without authorization
    res = client.post(
        "/efnyc/upload",
        json.dumps(VALID_PHONE_DATA),
        content_type="application/json"
    )
    assert res.status_code == 401
    assert res.json()["error"] == "Unauthorized request"


@pytest.mark.django_db
def test_upload_wrong_token(client, settings):
    # Test upload with wrong authorization token
    res = client.post(
        "/efnyc/upload",
        json.dumps(VALID_PHONE_DATA),
        content_type="application/json",
        HTTP_AUTHORIZATION="Bearer wrong_token"
    )
    assert res.status_code == 401
    assert res.json()["error"] == "Unauthorized request"


@pytest.mark.django_db
def test_options_request(client):
    # Test OPTIONS request for CORS
    res = client.options("/efnyc/upload")
    assert res.status_code == 200 