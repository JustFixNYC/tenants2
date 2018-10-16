import pytest
from project.airtable import Airtable, Record, Fields


URL = 'https://api.airtable.com/v0/appEH2XUPhLwkrS66/Users'

KEY = 'myapikey'

OUR_FIELDS = {
    'pk': 1,
    'Name': 'Boop Jones',
}

ALL_FIELDS = {
    **OUR_FIELDS,
    'SomeExtraFieldWeDoNotCareAbout': 'blarg blarg'
}

RECORD = {
    'id': 'recFLEuThPbUkwmsq',
    'createdTime': '2018-10-15T20:27:20.000Z',
    'fields': ALL_FIELDS
}

BASE_HEADERS = {
    'Authorization': f'Bearer myapikey'
}


def test_get_returns_record_when_records_is_nonempty(requests_mock):
    requests_mock.get(URL, request_headers=BASE_HEADERS,
                      json={'records': [RECORD]})
    airtable = Airtable(URL, KEY)
    record = airtable.get(1)
    assert record.fields_.Name == 'Boop Jones'


def test_get_returns_none_when_records_is_empty(requests_mock):
    requests_mock.get(URL, request_headers=BASE_HEADERS,
                      json={'records': []})
    airtable = Airtable(URL, KEY)
    record = airtable.get(1)
    assert record is None


def test_create_works(requests_mock):
    def expect_fields(request):
        assert request.json() == {'fields': OUR_FIELDS}
        return True

    requests_mock.post(URL, request_headers={
        'Content-Type': 'application/json',
        **BASE_HEADERS
    }, json=RECORD, additional_matcher=expect_fields)
    airtable = Airtable(URL, KEY)
    record = airtable.create(Fields(**OUR_FIELDS))
    assert record.id == 'recFLEuThPbUkwmsq'


def test_update_works(requests_mock):
    def expect_fields(request):
        assert request.json() == {'fields': OUR_FIELDS}
        return True

    requests_mock.patch(f'http://boop/recFLEuThPbUkwmsq', request_headers={
        'Content-Type': 'application/json',
        **BASE_HEADERS
    }, json=RECORD, additional_matcher=expect_fields)
    airtable = Airtable('http://boop', KEY)
    record = airtable.update(Record(**RECORD), Fields(**OUR_FIELDS))
    assert record.id == 'recFLEuThPbUkwmsq'


def test_list_works(requests_mock):
    requests_mock.get('http://boop?pageSize=1', request_headers=BASE_HEADERS,
                      complete_qs=True,
                      json={'records': [RECORD], 'offset': 'blarg'})
    airtable = Airtable('http://boop', KEY)
    gen = airtable.list(page_size=1)
    record = next(gen)
    assert record.id == 'recFLEuThPbUkwmsq'

    requests_mock.get('http://boop?pageSize=1&offset=blarg',
                      request_headers=BASE_HEADERS,
                      json={'records': [{**RECORD, 'id': 'blorp'}]})
    record2 = next(gen)
    assert record2.id == 'blorp'

    with pytest.raises(StopIteration):
        next(gen)
