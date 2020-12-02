from unittest.mock import MagicMock, patch
import pytest
import requests.exceptions

from ..record import EXAMPLE_FIELDS as OUR_FIELDS
from ..api import Airtable, Record, Fields, retry_request, RATE_LIMIT_TIMEOUT_SECS


URL = "https://api.airtable.com/v0/appEH2XUPhLwkrS66/Users"

KEY = "myapikey"

ALL_FIELDS = {**OUR_FIELDS, "SomeExtraFieldWeDoNotCareAbout": "blarg blarg"}

RECORD = {
    "id": "recFLEuThPbUkwmsq",
    "createdTime": "2018-10-15T20:27:20.000Z",
    "fields": ALL_FIELDS,
}

BASE_HEADERS = {"Authorization": f"Bearer myapikey"}


class TestRetryRequest:
    def req(self, max_retries=0):
        with patch("time.sleep") as sleep:
            res = retry_request("GET", "http://foo", max_retries=max_retries, headers={})
        self.sleep = sleep
        return res

    def test_returns_errors(self, requests_mock):
        requests_mock.get("http://foo", status_code=500)
        assert self.req(0).status_code == 500
        assert self.req(10).status_code == 500
        self.sleep.assert_not_called()

    def test_never_sleeps_after_last_attempt(self, requests_mock):
        requests_mock.get("http://foo", status_code=429)
        assert self.req(0).status_code == 429
        self.sleep.assert_not_called()

    def test_sleeps_before_retries(self, requests_mock):
        requests_mock.get("http://foo", status_code=429)
        assert self.req(1).status_code == 429
        self.sleep.called_once_with(RATE_LIMIT_TIMEOUT_SECS)


def test_request_raises_errors_on_bad_status(requests_mock):
    requests_mock.get(URL, status_code=422)
    with pytest.raises(requests.exceptions.HTTPError):
        Airtable(URL, KEY).request("GET")


def test_get_returns_record_when_records_is_nonempty(requests_mock):
    requests_mock.get(URL, request_headers=BASE_HEADERS, json={"records": [RECORD]})
    airtable = Airtable(URL, KEY)
    record = airtable.get(1)
    assert record.fields_.first_name == "Boop"


def test_get_returns_none_when_records_is_empty(requests_mock):
    requests_mock.get(URL, request_headers=BASE_HEADERS, json={"records": []})
    airtable = Airtable(URL, KEY)
    record = airtable.get(1)
    assert record is None


def test_create_works(requests_mock):
    def expect_fields(request):
        assert request.json() == {"fields": OUR_FIELDS}
        return True

    requests_mock.post(
        URL,
        request_headers={"Content-Type": "application/json", **BASE_HEADERS},
        json=RECORD,
        additional_matcher=expect_fields,
    )
    airtable = Airtable(URL, KEY)
    record = airtable.create(Fields(**OUR_FIELDS))
    assert record.id == "recFLEuThPbUkwmsq"


def test_update_works(requests_mock):
    def expect_fields(request):
        assert request.json() == {"fields": OUR_FIELDS}
        return True

    requests_mock.patch(
        f"http://boop/recFLEuThPbUkwmsq",
        request_headers={"Content-Type": "application/json", **BASE_HEADERS},
        json=RECORD,
        additional_matcher=expect_fields,
    )
    airtable = Airtable("http://boop", KEY)
    record = airtable.update(Record(**RECORD), Fields(**OUR_FIELDS))
    assert record.id == "recFLEuThPbUkwmsq"


def test_list_works(requests_mock):
    requests_mock.get(
        "http://boop?pageSize=1",
        request_headers=BASE_HEADERS,
        complete_qs=True,
        json={"records": [RECORD], "offset": "blarg"},
    )
    airtable = Airtable("http://boop", KEY)
    gen = airtable.list(page_size=1)
    record = next(gen)
    assert record.id == "recFLEuThPbUkwmsq"

    requests_mock.get(
        "http://boop?pageSize=1&offset=blarg",
        request_headers=BASE_HEADERS,
        json={"records": [{**RECORD, "id": "blorp"}]},
    )
    record2 = next(gen)
    assert record2.id == "blorp"

    with pytest.raises(StopIteration):
        next(gen)


def test_create_or_update_creates_if_nonexistent():
    airtable = Airtable(URL, KEY)
    airtable.get = MagicMock(return_value=None)
    airtable.create = MagicMock(return_value="a new record")
    assert airtable.create_or_update(Fields(**OUR_FIELDS)) == "a new record"
    airtable.get.assert_called_once_with(1)


def test_create_or_update_updates_if_preexisting():
    airtable = Airtable(URL, KEY)
    airtable.get = MagicMock(return_value=Record(**RECORD))
    airtable.update = MagicMock(return_value="an updated record")
    assert airtable.create_or_update(Fields(**OUR_FIELDS)) == "an updated record"
    airtable.get.assert_called_once_with(1)
