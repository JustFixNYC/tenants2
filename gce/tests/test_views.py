import pytest
import json

from gce.models import GoodCauseEvictionScreenerResponse


def base_headers(settings):
    return {
        "HTTP_AUTHORIZATION": f"Bearer {settings.GCE_API_TOKEN}",
        "content_type": "application/json",
    }


DATA_STEP_1 = {
    "bbl": "1234567890",
    "house_number": "123",
    "street_name": "MAIN ST",
    "borough": "BROOKLYN",
    "zipcode": "12345",
}

DATA_STEP_2 = {
    "address_confirmed": "true",
    "nycdb_results": {"test": "structure of json not enforced, so not included"},
}

DATA_STEP_3 = {
    "form_answers": {
        "bedrooms": "STUDIO",
        "rent": 1000.50,
        "owner_occupied": "YES",
        "rent_stab": "NO",
        "subsidy": "UNSURE",
    }
}

DATA_STEP_4 = {
    "result_coverage": "UNKNOWN",
    "result_criteria": {
        "rent": "ELIGIBLE",
        "rent_stab": "INELIGIBLE",
        "building_class": "ELIGIBLE",
        "c_of_o": "ELIGIBLE",
        "subsidy": "ELIGIBLE",
        "portfolio_size": "UNKNOWN",
    },
}

INVALID_DATA = {
    "bbl": "X",
    "address_confirmed": "X",
    "form_answers": {
        "X": "STUDIO",
        "rent": 1000.50,
        "owner_occupied": "NO",
        "rent_stab": "NO",
        "subsidy": "X",
    },
    "result_coverage": "X",
}

INVALID_ERRORS = [
    {
        "loc": ["bbl"],
        "msg": "BBL must be 10-digit zero padded string",
    },
    {
        "loc": ["address_confirmed"],
        "msg": "value could not be parsed to a boolean",
    },
    {
        "loc": ["form_answers", "bedrooms"],
        "msg": "field required",
    },
    {
        "loc": ["form_answers", "subsidy"],
        "msg": "unexpected value; permitted: 'NYCHA', 'SUBSIDIZED', 'NONE', 'UNSURE'",
    },
    {
        "loc": ["result_coverage"],
        "msg": "unexpected value; permitted: 'COVERED', 'NOT_COVERED', 'UNKNOWN'",
    },
]


def create_new_gce_record():
    gcer = GoodCauseEvictionScreenerResponse(**DATA_STEP_1)
    gcer.full_clean()
    gcer.save()
    user_id = {"id": gcer.pk}
    return gcer, user_id


def authorized_request(client, settings, post_data, **kawrgs):
    return client.post(
        "/gce/upload",
        json.dumps(post_data),
        HTTP_ORIGIN=settings.GCE_ORIGIN,
        **base_headers(settings),
        **kawrgs,
    )


def get_gcer_by_id(id):
    return GoodCauseEvictionScreenerResponse.objects.get(id=id)


@pytest.mark.django_db
def test_unauthorized_request_fails(client, settings):
    res = client.post("/gce/upload", HTTP_ORIGIN=settings.GCE_ORIGIN)
    assert res.status_code == 401
    assert res.json()["error"] == "Unauthorized request"


@pytest.mark.django_db
def test_initial_post_creates_record(client, settings):
    res = authorized_request(client, settings, DATA_STEP_1)
    assert res.status_code == 200
    assert res["Content-Type"] == "application/json"
    data = res.json()
    gcer = get_gcer_by_id(data["id"])
    assert gcer.bbl == DATA_STEP_1["bbl"]


@pytest.mark.django_db
def test_subsequent_post_updates_record(client, settings):
    gcer, user_id = create_new_gce_record()

    res = authorized_request(client, settings, {**DATA_STEP_2, **user_id})
    assert res.status_code == 200
    assert res.json() == user_id

    gcer.refresh_from_db()
    assert gcer.address_confirmed is True
    assert gcer.updated_at > gcer.created_at


@pytest.mark.django_db
def test_valid_data_works(client, settings):
    res = authorized_request(client, settings, {**DATA_STEP_1})
    assert res.status_code == 200
    user = res.json()

    res = authorized_request(client, settings, {**DATA_STEP_2, **user})
    assert res.status_code == 200

    res = authorized_request(client, settings, {**DATA_STEP_3, **user})
    assert res.status_code == 200

    res = authorized_request(client, settings, {**DATA_STEP_4, **user})
    assert res.status_code == 200

    gcer = get_gcer_by_id(user["id"])

    for field in GoodCauseEvictionScreenerResponse._meta.get_fields():
        if not field.null and field.name != "id":
            value = getattr(gcer, field.name)
            assert value is not None


@pytest.mark.django_db
def test_invalid_data_fails(client, settings):
    res = authorized_request(client, settings, INVALID_DATA)
    assert res.status_code == 400
    data = res.json()
    assert data["error"] == "Invalid POST data"
    details = json.loads(data["details"])
    assert len(details) == len(INVALID_ERRORS)
    for error, expected in zip(details, INVALID_ERRORS):
        assert error["loc"] == expected["loc"]
        assert error["msg"] == expected["msg"]


@pytest.mark.django_db
def test_nonexistant_user_fails(client, settings):
    post_data = {"id": 100, **DATA_STEP_2}
    res = authorized_request(client, settings, post_data)
    assert res.status_code == 500
    assert res.json()["error"] == "User does not exist"


@pytest.mark.django_db
def test_initial_preserved_final_updates(client, settings):
    gcer, user_id = create_new_gce_record()

    initial_data = {**user_id, "result_coverage": "UNKNOWN"}
    final_data = {**user_id, "result_coverage": "COVERED"}

    res_initial = authorized_request(client, settings, initial_data)
    assert res_initial.status_code == 200

    gcer.refresh_from_db()
    assert gcer.result_coverage_initial == initial_data["result_coverage"]

    res_final = authorized_request(client, settings, final_data)
    assert res_final.status_code == 200

    gcer.refresh_from_db()
    assert gcer.result_coverage_initial == initial_data["result_coverage"]
    assert gcer.result_coverage_final == final_data["result_coverage"]


@pytest.mark.django_db
def test_invalid_origin_fails(client, settings):
    res = client.post(
        "/gce/upload",
        json.dumps(DATA_STEP_1),
        **base_headers(settings),
        HTTP_ORIGIN="https://example.com",
    )
    assert res.status_code == 403
    assert res.json()["error"] == "Invalid origin"
