import json
from pathlib import Path
import requests.exceptions
import requests_mock

from project import geocoding


MY_DIR = Path(__file__).parent.resolve()

EXAMPLE_SEARCH = json.loads((MY_DIR / 'test_geocoding_example_search.json').read_text())


def test_search_works():
    with requests_mock.Mocker() as m:
        m.get(geocoding.SEARCH_URL, json=EXAMPLE_SEARCH)
        results = geocoding.search("150 court")
        assert results[0].properties.label == "150 COURT STREET, Brooklyn, New York, NY, USA"


def assert_response_is_none(**kwargs):
    with requests_mock.Mocker() as m:
        m.get(geocoding.SEARCH_URL, **kwargs)
        assert geocoding.search("150 court") is None


def test_search_returns_none_on_500():
    assert_response_is_none(status_code=500)


def test_search_returns_none_on_request_exception():
    assert_response_is_none(exc=requests.exceptions.Timeout)


def test_search_returns_none_on_bad_result():
    assert_response_is_none(json={'blarg': False})
