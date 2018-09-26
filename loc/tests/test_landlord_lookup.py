import json
from pathlib import Path
import pytest
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError
import requests.exceptions

from project.tests.test_geocoding import EXAMPLE_SEARCH as EXAMPLE_GEO_SEARCH
from loc.landlord_lookup import lookup_landlord, _extract_landlord_info, LandlordInfo


MY_DIR = Path(__file__).parent.resolve()

EXAMPLE_SEARCH = json.loads((MY_DIR / 'test_landlord_lookup_example_search.json').read_text())


def test_lookup_landlord_command_works(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    requests_mock.get(settings.LANDLORD_LOOKUP_URL, json=EXAMPLE_SEARCH)
    call_command('lookup_landlord', '150 court, brooklyn')

    with pytest.raises(CommandError):
        requests_mock.get(settings.LANDLORD_LOOKUP_URL, status_code=500)
        call_command('lookup_landlord', '150 court, brooklyn')


def test_lookup_landlord_works(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    requests_mock.get(settings.LANDLORD_LOOKUP_URL, json=EXAMPLE_SEARCH)
    results = lookup_landlord("150 court, brooklyn")
    assert results.name == "BOBBY DENVER"
    assert results.address == "123 DOOMBRINGER STREET 4 11299"


def test_lookup_landlord_returns_none_on_geocoding_500(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, status_code=500)
    assert lookup_landlord("150 court, brooklyn") is None


def test_lookup_landlord_returns_none_on_landlord_api_500(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    requests_mock.get(settings.LANDLORD_LOOKUP_URL, status_code=500)
    assert lookup_landlord("150 court, brooklyn") is None


def test_search_returns_none_on_request_exception(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    requests_mock.get(settings.LANDLORD_LOOKUP_URL, exc=requests.exceptions.Timeout)
    assert lookup_landlord("150 court, brooklyn") is None


def test_search_returns_none_on_bad_result(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_GEO_SEARCH)
    requests_mock.get(settings.LANDLORD_LOOKUP_URL, json={'blarg': False})
    assert lookup_landlord("150 court, brooklyn") is None


def test_extract_landlord_info_works():
    assert _extract_landlord_info({'result': []}) is None

    assert _extract_landlord_info({'result': [{
        'ownername': None,
        'businessaddr': None
    }]}) is None

    assert _extract_landlord_info({'result': [{
        'ownername': 'boof',
        'businessaddr': None
    }]}) == LandlordInfo(name='boof', address='')

    assert _extract_landlord_info({'result': [{
        'ownername': None,
        'businessaddr': '1234'
    }]}) == LandlordInfo(name='', address='1234')
