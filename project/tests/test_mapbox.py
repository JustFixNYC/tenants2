import json
import pytest
from django.core.management import call_command
import urllib.parse

from project.justfix_environment import BASE_DIR
from project.mapbox import (
    mapbox_places_request,
    find_city,
    get_mapbox_state,
    MapboxFeature,
    MAPBOX_PLACES_URL,
)

JSON_DIR = BASE_DIR / 'frontend' / 'lib' / 'forms' / 'mapbox' / 'tests'

BROOKLYN_FEATURE_JSON = json.loads((JSON_DIR / 'brooklyn.json').read_text())
BROOKLYN_FEATURE = MapboxFeature(**BROOKLYN_FEATURE_JSON)
BROOKLYN_RESULTS_JSON = {
    'features': [BROOKLYN_FEATURE_JSON],
}


@pytest.fixture(autouse=True)
def setup_fixture(settings):
    settings.MAPBOX_ACCESS_TOKEN = 'boop'


def mock_brooklyn_results(query: str, requests_mock):
    url = f"{MAPBOX_PLACES_URL}/{urllib.parse.quote(query)}.json"
    requests_mock.get(url, json=BROOKLYN_RESULTS_JSON)


class TestGetMapboxState:
    def test_it_returns_none_on_no_match(self):
        assert get_mapbox_state(MapboxFeature(context=[], text="blah")) is None

    def test_it_returns_state_on_match(self):
        assert get_mapbox_state(BROOKLYN_FEATURE) == "NY"


class TestMapboxPlacesRequest:
    def test_it_returns_none_when_mapbox_is_disabled(self, settings):
        settings.MAPBOX_ACCESS_TOKEN = ''
        assert mapbox_places_request("blah", {}) is None

    def test_it_returns_none_on_http_500(self, requests_mock):
        requests_mock.get(f"{MAPBOX_PLACES_URL}/a%20b.json", status_code=500)
        assert mapbox_places_request("a b", {}) is None

    def test_it_returns_results_on_success(self, requests_mock):
        requests_mock.get(f"{MAPBOX_PLACES_URL}/br.json", json=BROOKLYN_RESULTS_JSON)
        results = mapbox_places_request('br', {})
        assert results and results.features[0].text == "Brooklyn"


class TestFindCity:
    def test_it_returns_none_on_mapbox_failure(self, settings):
        settings.MAPBOX_ACCESS_TOKEN = ''
        assert find_city('zzz', 'OH') is None

    def test_it_returns_empty_list_when_no_states_match(self, requests_mock):
        mock_brooklyn_results("brook, GA", requests_mock)
        assert find_city('brook', 'GA') == []

    def test_it_returns_nonempty_list_when_states_match(self, requests_mock):
        mock_brooklyn_results("brook, NY", requests_mock)
        assert find_city('brook', 'NY') == ['Brooklyn']


def test_findmapboxcity_command_does_not_explode(settings):
    settings.MAPBOX_ACCESS_TOKEN = ''
    call_command('findmapboxcity', 'brooklyn', 'NY')
