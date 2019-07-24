import pytest

from project.tests.test_geocoding import EXAMPLE_SEARCH, enable_fake_geocoding
from data_driven_onboarding import schema


class TestSchema:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client):
        self.graphql_client = graphql_client

    def request(self, address: str, borough: str):
        res = self.graphql_client.execute(
            '''
            query {
                output: ddoSuggestions(address: "%s", borough: "%s") {
                    fullAddress,
                    bbl,
                    unitCount
                }
            }
            ''' % (address, borough)
        )['data']['output']

        return res

    def test_it_returns_none_when_wow_integration_is_disabled(self):
        assert self.request('boop', '') is None

    def test_it_returns_none_when_geocoding_is_unavailable(self, settings):
        settings.WOW_DATABASE = 'blah'
        assert self.request('boop', '') is None

    @enable_fake_geocoding
    def test_it_works(self, settings, requests_mock, monkeypatch):
        settings.WOW_DATABASE = 'blah'
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
        monkeypatch.setattr(schema, 'run_ddo_sql_query', lambda bbl: {'unit_count': 123})
        assert self.request('150 court', '') == {
            'fullAddress': '150 COURT STREET, Brooklyn, New York, NY, USA',
            'bbl': '3002920026',
            'unitCount': 123
        }
