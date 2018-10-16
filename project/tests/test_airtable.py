from unittest.mock import MagicMock, patch
from io import StringIO
import pytest

from project.airtable import Airtable, Record, Fields, AirtableSynchronizer, logger
from users.tests.factories import UserFactory


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


def test_create_or_update_creates_if_nonexistent():
    airtable = Airtable(URL, KEY)
    airtable.get = MagicMock(return_value=None)
    airtable.create = MagicMock(return_value='a new record')
    assert airtable.create_or_update(Fields(**OUR_FIELDS)) == 'a new record'
    airtable.get.assert_called_once_with(1)


def test_create_or_update_updates_if_preexisting():
    airtable = Airtable(URL, KEY)
    airtable.get = MagicMock(return_value=Record(**RECORD))
    airtable.update = MagicMock(return_value='an updated record')
    assert airtable.create_or_update(Fields(**OUR_FIELDS)) == 'an updated record'
    airtable.get.assert_called_once_with(1)


def test_from_settings_works(settings):
    settings.AIRTABLE_URL = 'https://blarg'
    settings.AIRTABLE_API_KEY = 'zzz'
    airtable = Airtable.from_settings()
    syncer = AirtableSynchronizer()
    for a in [airtable, syncer.airtable]:
        assert a.url == 'https://blarg'
        assert a.api_key == 'zzz'


class FakeAirtable:
    def __init__(self):
        self._records = []
        self._next_id = 1

    def list(self):
        for record in self._records:
            yield record.copy()

    def get(self, pk):
        records = [r for r in self._records if r.fields_.pk == pk]
        if records:
            return records[0].copy()
        return None

    def create(self, fields):
        record = Record(**{
            **RECORD,
            'id': str(self._next_id),
            'fields': fields.dict()
        })
        self._next_id += 1
        self._records.append(record.copy())
        return record

    def update(self, record, fields):
        our_record = [r for r in self._records
                      if r.fields_.pk == record.fields_.pk][0]
        our_record.fields_ = Fields(**{
            **our_record.fields_.dict(),
            **fields.dict()
        })


def test_multiple_rows_with_same_pk_are_logged():
    airtable = FakeAirtable()
    syncer = AirtableSynchronizer(airtable)
    for i in range(2):
        airtable.create(Fields(**OUR_FIELDS))
    with patch.object(logger, 'warn') as m:
        syncer._get_record_dict()
    m.assert_called_once_with('Multiple rows with pk 1 exist in Airtable!')


@pytest.mark.django_db
def test_airtable_synchronizer_works():
    user = UserFactory.create(
        full_name='Boop Jones', phone_number='5551234567', username='boop')

    airtable = FakeAirtable()
    syncer = AirtableSynchronizer(airtable)

    def resync():
        io = StringIO()
        syncer.sync_users(stdout=io)
        return io.getvalue()

    assert resync() == '5551234567 (Boop Jones) does not exist in Airtable, adding them.\n'
    assert airtable.get(user.pk).fields_.Name == 'Boop Jones'
    assert resync() == '5551234567 (Boop Jones) is already synced.\n'

    user.last_name = 'Denver'
    user.save()
    assert resync() == 'Updating 5551234567 (Boop Denver).\n'
    assert airtable.get(user.pk).fields_.Name == 'Boop Denver'
