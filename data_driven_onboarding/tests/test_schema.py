import pytest

from project.tests.test_geocoding import EXAMPLE_SEARCH
from data_driven_onboarding import schema


class TestSchema:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.graphql_client = graphql_client

    def request(self, address: str, borough: str):
        res = self.graphql_client.execute(
            """
            query {
                output: ddoSuggestions(address: "%s", borough: "%s") {
                    fullAddress,
                    mostCommonCategoryOfHpdComplaint,
                    bbl,
                    unitCount
                }
            }
            """
            % (address, borough)
        )["data"]["output"]

        return res

    def test_it_returns_none_when_address_is_blank(self):
        assert self.request("   ", "") is None

    def test_it_returns_none_when_wow_integration_is_disabled(self):
        assert self.request("boop", "") is None

    def test_it_returns_none_when_geocoding_is_unavailable(self, settings):
        settings.WOW_DATABASE = "blah"
        assert self.request("boop", "") is None

    def test_it_works(self, settings, requests_mock, monkeypatch):
        settings.GEOCODING_SEARCH_URL = "http://bawlabr"
        settings.WOW_DATABASE = "blah"
        requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)
        monkeypatch.setattr(
            schema,
            "run_ddo_sql_query",
            lambda bbl: {
                "unit_count": 123,
                "zipcode": "11201",
                "most_common_category_of_hpd_complaint": "CABINET",
            },
        )
        assert self.request("150 court", "") == {
            "fullAddress": "150 COURT STREET, Brooklyn, New York, NY, USA",
            "mostCommonCategoryOfHpdComplaint": "CABINETS",
            "bbl": "3002920026",
            "unitCount": 123,
        }

    def test_it_returns_none_when_bbl_is_not_in_database(self, settings, monkeypatch):
        settings.WOW_DATABASE = "blah"
        monkeypatch.setattr(
            schema,
            "run_ddo_sql_query",
            lambda bbl: [],
        )
        assert self.request("address where bbl is missing from db", "Brooklyn") is None

    def test_sql_query_contains_no_unexpected_characters(self):
        sql = schema.DDO_SQL_FILE.read_text()
        assert "\u00a0" not in sql, "SQL should not contain non-breaking spaces"
        assert "\t" not in sql, "SQL should not contain tabs (please use spaces instead)"


@pytest.mark.parametrize(
    "category,normalized", [("blah", "blah"), (None, None), ("GENERAL", "GENERAL DISREPAIR")]
)
def test_normalize_complaint_category_works(category, normalized):
    query = {"most_common_category_of_hpd_complaint": category}
    assert schema.normalize_complaint_category(query) == {
        "most_common_category_of_hpd_complaint": normalized
    }
