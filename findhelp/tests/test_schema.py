import pytest

from .test_models import create_sample_tenant_resources


class TestTenantResources:
    @pytest.fixture(autouse=True)
    def setup(self, graphql_client):
        self.graphql_client = graphql_client

    def query(self, latitude, longitude):
        return self.graphql_client.execute(
            """
            query MyQuery($latitude: Float!, $longitude: Float!) {
                tenantResources(latitude: $latitude, longitude: $longitude) {
                    name,
                    latitude,
                    longitude,
                    milesAway
                }
            }
            """,
            variables={"latitude": latitude, "longitude": longitude},
        )["data"]["tenantResources"]

    def test_it_works(self, db, fake_geocoder):
        create_sample_tenant_resources(db, fake_geocoder)
        results = self.query(0.6, 0.5)
        assert len(results) == 2
        assert results[0] == {
            "latitude": 0.6,
            "longitude": 0.5,
            "milesAway": 0.0,
            "name": "Ultra Help",
        }
        assert results[1]["name"] == "Funky Help"
        assert int(results[1]["milesAway"]) == 40

    def test_it_returns_none_if_findhelp_is_disabled(self, simulate_findhelp_disabled):
        assert self.query(0.6, 0.5) is None
