from unittest.mock import MagicMock, patch
from io import StringIO
import pytest
import requests.exceptions
from django.core.management import call_command
from django.core.management.base import CommandError

from project.airtable import (
    Airtable, Record, Fields, AirtableSynchronizer, logger, retry_request,
    RATE_LIMIT_TIMEOUT_SECS, sync_user)
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


class TestRetryRequest:
    def req(self, max_retries=0):
        with patch('time.sleep') as sleep:
            res = retry_request('GET', 'http://foo', max_retries=max_retries, headers={})
        self.sleep = sleep
        return res

    def test_returns_errors(self, requests_mock):
        requests_mock.get('http://foo', status_code=500)
        assert self.req(0).status_code == 500
        assert self.req(10).status_code == 500
        self.sleep.assert_not_called()

    def test_never_sleeps_after_last_attempt(self, requests_mock):
        requests_mock.get('http://foo', status_code=429)
        assert self.req(0).status_code == 429
        self.sleep.assert_not_called()

    def test_sleeps_before_retries(self, requests_mock):
        requests_mock.get('http://foo', status_code=429)
        assert self.req(1).status_code == 429
        self.sleep.called_once_with(RATE_LIMIT_TIMEOUT_SECS)


def test_request_raises_errors_on_bad_status(requests_mock):
    requests_mock.get(URL, status_code=500)
    with pytest.raises(requests.exceptions.HTTPError):
        Airtable(URL, KEY).request('GET')


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


def configure_airtable_settings(settings, url='https://blarg', api_key='zzz'):
    settings.AIRTABLE_URL = url
    settings.AIRTABLE_API_KEY = api_key


def test_params_are_pulled_from_settings_by_default(settings):
    configure_airtable_settings(settings)
    airtable = Airtable()
    syncer = AirtableSynchronizer()
    for a in [airtable, syncer.airtable]:
        assert a.url == 'https://blarg'
        assert a.api_key == 'zzz'


def test_error_raised_if_settings_not_configured():
    with pytest.raises(ValueError):
        Airtable()

    with pytest.raises(ValueError):
        AirtableSynchronizer()


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


class TestSyncUser:
    def test_is_noop_if_airtable_is_disabled(self):
        sync_user(None)

    @pytest.mark.django_db
    def test_exceptions_are_caught_and_logged(self, settings):
        configure_airtable_settings(settings)
        user = UserFactory()
        with patch('project.airtable.Airtable') as constructor_mock:
            airtable_mock = MagicMock()
            airtable_mock.create_or_update.side_effect = Exception('kabooom')
            constructor_mock.return_value = airtable_mock
            with patch.object(logger, 'exception') as m:
                sync_user(user)
        m.assert_called_once_with('Error while communicating with Airtable')

    @pytest.mark.django_db
    def test_it_works(self, settings):
        configure_airtable_settings(settings)
        user = UserFactory()
        with patch('project.airtable.Airtable'):
            with patch.object(logger, 'exception') as m:
                sync_user(user)
        m.assert_not_called()


class TestSyncAirtableCommand:
    def test_it_raises_error_when_settings_are_not_defined(self):
        with pytest.raises(CommandError, match='AIRTABLE_API_KEY must be configured'):
            call_command('syncairtable')

    @pytest.mark.django_db
    def test_it_works(self, settings):
        configure_airtable_settings(settings)

        UserFactory.create()
        io = StringIO()
        with patch('project.management.commands.syncairtable.Airtable') as m:
            m.return_value = FakeAirtable()
            call_command('syncairtable', stdout=io)
        assert io.getvalue().split('\n') == [
            'Retrieving current Airtable...',
            '5551234567 (Boop Jones) does not exist in Airtable, adding them.',
            'Finished synchronizing with Airtable!',
            ''
        ]
