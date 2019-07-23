import pytest


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
                    bbl
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
