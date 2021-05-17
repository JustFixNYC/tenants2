import json
from project.util.geojson import FeatureGeometry
import pytest
from django.core.management import call_command
import urllib.parse

from project.justfix_environment import BASE_DIR
from project.mapbox import (
    _encode_query_for_places_request,
    mapbox_places_request,
    find_city,
    get_mapbox_state,
    get_mapbox_zip_code,
    get_mapbox_street_addr,
    does_city_match,
    find_address,
    StreetAddress,
    MapboxFeature,
    MAPBOX_PLACES_URL,
)

JSON_DIR = BASE_DIR / "frontend" / "lib" / "forms" / "mapbox" / "tests"

BROOKLYN_FEATURE_JSON = json.loads((JSON_DIR / "brooklyn.json").read_text())
BROOKLYN_FEATURE = MapboxFeature(**BROOKLYN_FEATURE_JSON)
SAN_JUAN_FEATURE_JSON = json.loads((JSON_DIR / "san-juan.json").read_text())
SAN_JUAN_FEATURE = MapboxFeature(**SAN_JUAN_FEATURE_JSON)
BRL_FEATURE_JSON = json.loads((JSON_DIR / "brl.json").read_text())
BRL_FEATURE = MapboxFeature(**BRL_FEATURE_JSON)
BRL_RESULTS_JSON = {
    "features": [BRL_FEATURE_JSON],
}
BROOKLYN_RESULTS_JSON = {
    "features": [BROOKLYN_FEATURE_JSON],
}
LA_FEATURE_JSON = json.loads((JSON_DIR / "la-city-hall.json").read_text())
LA_FEATURE = MapboxFeature(**LA_FEATURE_JSON)
LA_RESULTS_JSON = {
    "features": [LA_FEATURE_JSON],
}


def mkfeature(base=BROOKLYN_FEATURE_JSON, **kwargs):
    final_kwargs = {
        **base,
        **kwargs,
    }
    return MapboxFeature(**final_kwargs)


@pytest.fixture(autouse=True)
def setup_fixture(settings):
    settings.MAPBOX_ACCESS_TOKEN = "boop"


def mock_places_request(query: str, json_data, requests_mock):
    url = f"{MAPBOX_PLACES_URL}/{urllib.parse.quote(query)}.json"
    requests_mock.get(url, json=json_data)


def mock_brooklyn_results(query: str, requests_mock):
    mock_places_request(query, BROOKLYN_RESULTS_JSON, requests_mock)


def mock_brl_results(query: str, requests_mock):
    mock_places_request(query, BRL_RESULTS_JSON, requests_mock)


def mock_la_results(query: str, requests_mock):
    mock_places_request(query, LA_RESULTS_JSON, requests_mock)


def mock_no_results(query: str, requests_mock):
    mock_places_request(query, {"features": []}, requests_mock)


class TestGetMapboxState:
    def test_it_returns_none_on_no_match(self):
        assert get_mapbox_state(mkfeature(context=[])) is None

    def test_it_returns_state_on_match(self):
        assert get_mapbox_state(BROOKLYN_FEATURE) == "NY"

    def test_it_works_with_puerto_rico(self):
        assert get_mapbox_state(SAN_JUAN_FEATURE) == "PR"


class TestGetMapboxZipCode:
    def test_it_returns_none_on_no_match(self):
        assert get_mapbox_zip_code(mkfeature(context=[])) is None

    def test_it_returns_zipcode_on_match(self):
        assert get_mapbox_zip_code(BRL_FEATURE) == "11201"


class TestDoesCityMatch:
    def test_it_returns_false_on_no_match(self):
        assert does_city_match("columbus", BRL_FEATURE) is False

    def test_it_returns_true_on_match(self):
        assert does_city_match("BROOKLYN", BRL_FEATURE) is True
        assert does_city_match("Brooklyn", BRL_FEATURE) is True


@pytest.mark.parametrize(
    "feature,expected",
    [
        (BRL_FEATURE, "150 Court Street"),
        (mkfeature(BRL_FEATURE_JSON, address=None), "Court Street"),
    ],
)
def test_get_mapbox_street_addr(feature, expected):
    assert get_mapbox_street_addr(feature) == expected


@pytest.mark.parametrize(
    "query,expected",
    [
        # Ensure slashes are escaped.
        ("1/2", "1%2F2"),
        # Ensure semicolons are replaced with commas.
        ("boop;jones", "boop%2Cjones"),
    ],
)
def test_encode_query_for_places_request(query, expected):
    assert _encode_query_for_places_request(query) == expected


class TestMapboxPlacesRequest:
    def test_it_returns_none_when_mapbox_is_disabled(self, settings):
        settings.MAPBOX_ACCESS_TOKEN = ""
        assert mapbox_places_request("blah", {}) is None

    def test_it_returns_none_on_http_500(self, requests_mock):
        requests_mock.get(f"{MAPBOX_PLACES_URL}/a%20b.json", status_code=500)
        assert mapbox_places_request("a b", {}) is None

    def test_it_returns_empty_results_on_http_422(self, requests_mock):
        requests_mock.get(f"{MAPBOX_PLACES_URL}/a%20b.json", status_code=422)
        assert mapbox_places_request("a b", {}).features == []

    def test_it_returns_results_on_success(self, requests_mock):
        requests_mock.get(f"{MAPBOX_PLACES_URL}/br.json", json=BROOKLYN_RESULTS_JSON)
        results = mapbox_places_request("br", {})
        assert results and results.features[0].text == "Brooklyn"


class TestFindCity:
    def test_it_returns_none_on_mapbox_failure(self, settings):
        settings.MAPBOX_ACCESS_TOKEN = ""
        assert find_city("zzz", "OH") is None

    def test_it_returns_empty_list_when_no_states_match(self, requests_mock):
        mock_brooklyn_results("brook, GA", requests_mock)
        assert find_city("brook", "GA") == []

    def test_it_returns_nonempty_list_when_states_match(self, requests_mock):
        mock_brooklyn_results("brook, NY", requests_mock)
        assert find_city("brook", "NY") == [("Brooklyn", (-73.9496, 40.6501))]


class TestFindAddress:
    BRL = StreetAddress(
        "150 Court Street",
        "11201",
        "150 Court Street, Brooklyn, New York 11201, United States",
        FeatureGeometry(type="Point", coordinates=[-73.992972, 40.688772]),
    )

    def test_it_returns_none_on_mapbox_failure(self, settings):
        settings.MAPBOX_ACCESS_TOKEN = ""
        assert find_address("zzz", "blarg", "OH", "12345") is None

    def test_it_returns_empty_list_when_no_addresses_match(self, requests_mock):
        mock_brl_results("1 boop st, bespin, OH 12345", requests_mock)
        assert find_address("1 boop st", "bespin", "OH", "12345") == []

    def test_it_returns_nonempty_list_when_addresses_match(self, requests_mock):
        mock_brl_results("150 court st, brooklyn, NY 12345", requests_mock)
        assert find_address("150 court st", "brooklyn", "NY", "12345") == [self.BRL]

    def test_it_can_include_results_in_same_state_outside_of_city(self, requests_mock):
        mock_brl_results("1 boop st, bespin, NY 12345", requests_mock)
        assert find_address("1 boop st", "bespin", "NY", "12345") == [self.BRL]


def test_findmapboxcity_command_does_not_explode(settings):
    settings.MAPBOX_ACCESS_TOKEN = ""
    call_command("findmapboxcity", "brooklyn", "NY")


def test_findmapboxaddr_command_does_not_explode(settings):
    settings.MAPBOX_ACCESS_TOKEN = ""
    call_command("findmapboxaddr", "150 court st", "brooklyn", "NY", "11201")
