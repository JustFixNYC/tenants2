from typing import Any, Dict
import pytest
from unittest.mock import MagicMock

from project.tests.test_geocoding import EXAMPLE_SEARCH
from nycx import views


EMPTY_SEARCH: Dict[str, Any] = {
    **EXAMPLE_SEARCH,
    "features": [],
}


@pytest.fixture
def configured(settings, monkeypatch):
    settings.GEOCODING_SEARCH_URL = "http://blah"
    settings.NYCDB_DATABASE = "blah"
    predict_housing_type = MagicMock()
    predict_housing_type.return_value = None
    monkeypatch.setattr(views, "predict_housing_type", predict_housing_type)
    yield {"predict_housing_type": predict_housing_type}


class TestEvaluateAddress:
    def test_it_returns_501_when_unconfigured(self, client):
        assert client.get("/nycx/address").status_code == 501

    def test_it_returns_400_with_no_argument(self, client, configured):
        assert client.get("/nycx/address").status_code == 400

    def test_it_returns_400_with_empty_argument(self, client, configured):
        assert client.get("/nycx/address?text=").status_code == 400

    def test_it_returns_502_when_geocoding_fails(self, client, configured, requests_mock, settings):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, status_code=500)
        assert client.get("/nycx/address?text=boop").status_code == 502

    def test_it_returns_null_result(self, client, configured, requests_mock, settings):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EMPTY_SEARCH)
        res = client.get("/nycx/address?text=boop")
        assert res.status_code == 200
        assert res.json() == {"result": None, "status": 200}

    def test_it_returns_successful_result(self, client, configured, requests_mock, settings):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
        res = client.get("/nycx/address?text=boop")
        assert res.status_code == 200
        j = res.json()
        assert j["status"] == 200
        r = j["result"]
        assert r["label"] == "150 COURT STREET, Brooklyn, New York, NY, USA"
        assert r["predicted_housing_type"] is None

    def test_it_sets_predicted_housing_type(self, client, configured, requests_mock, settings):
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
        configured["predict_housing_type"].return_value = "MARKET_RATE"
        res = client.get("/nycx/address?text=boop")
        assert res.status_code == 200
        assert res.json()["result"]["predicted_housing_type"] == "MARKET_RATE"
