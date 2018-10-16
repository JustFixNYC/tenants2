from project.airtable import Airtable


URL = 'https://api.airtable.com/v0/appEH2XUPhLwkrS66/Users'

KEY = 'myapikey'

RECORD = {
    'id': 'recFLEuThPbUkwmsq',
    'createdTime': '2018-10-15T20:27:20.000Z',
    'fields': {
        'pk': 1,
        'Name': 'Boop Jones',
        'SomeExtraFieldWeDoNotCareAbout': 'blarg blarg'
    }
}


def test_get_returns_record_when_records_is_nonempty(requests_mock):
    requests_mock.get(URL, json={'records': [RECORD]})
    airtable = Airtable(URL, KEY)
    record = airtable.get(1)
    assert record.fields_.Name == 'Boop Jones'


def test_get_returns_none_when_records_is_empty(requests_mock):
    requests_mock.get(URL, json={'records': []})
    airtable = Airtable(URL, KEY)
    record = airtable.get(1)
    assert record is None
