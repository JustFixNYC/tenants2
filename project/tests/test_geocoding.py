import json
from pathlib import Path
import pytest
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import CommandError
import requests.exceptions

from project import geocoding


MY_DIR = Path(__file__).parent.resolve()

EXAMPLE_SEARCH = json.loads((MY_DIR / 'test_geocoding_example_search.json').read_text())


def test_geocode_command_works(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
    call_command('geocode', '150 court')

    with pytest.raises(CommandError):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, status_code=500)
        call_command('geocode', '150 court')


def test_search_works(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
    results = geocoding.search("150 court")
    assert results[0].properties.label == "150 COURT STREET, Brooklyn, New York, NY, USA"


def test_search_returns_none_on_500(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, status_code=500)
    assert geocoding.search("150 court") is None


def test_search_returns_none_on_request_exception(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, exc=requests.exceptions.Timeout)
    assert geocoding.search("150 court") is None


def test_search_returns_none_on_bad_result(requests_mock):
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json={'blarg': False})
    assert geocoding.search("150 court") is None
