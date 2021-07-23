import pytest

from frontend.tests.util import get_frontend_query
from project.tests.test_geocoding import EXAMPLE_SEARCH
from rh import schema
from rh.tests.factories import RentalHistoryRequestFactory
from rh.schema import get_slack_notify_text
from rh.models import RentalHistoryRequest
from rh.tests.test_utils import EXAMPLE_RENT_STAB_DATA

VALID_RH_DATA = {
    "firstName": "Boop",
    "lastName": "Jones",
    "address": "123 Boop Way",
    "borough": "STATEN_ISLAND",
    "apartmentNumber": "36C",
    "phoneNumber": "2120000000",
}

RH_DATA_QUERY = """
query {
    session {
        rentalHistoryInfo {
            firstName
            lastName
            address
            borough
            apartmentNumber
            phoneNumber
        }
    }
}
"""

RH_EMAIL_MUTATION = """
mutation {
    rhSendEmail(input: {}) {
        errors { field, messages }
        session {
            rentalHistoryInfo {
                firstName
            }
        }
    }
}
"""


def _get_rh_info(graphql_client):
    return graphql_client.execute(RH_DATA_QUERY)["data"]["session"]["rentalHistoryInfo"]


def _exec_rh_form(graphql_client, **input_kwargs):
    return graphql_client.execute(
        get_frontend_query(f"RhFormMutation.graphql"),
        variables={"input": {**VALID_RH_DATA, **input_kwargs}},
    )["data"][f"output"]


@pytest.fixture
def mock_geocoding_and_nycdb(settings, requests_mock):
    settings.NYCDB_DATABASE = "blah"
    settings.GEOCODING_SEARCH_URL = "http://bawlabr"
    requests_mock.get(settings.GEOCODING_SEARCH_URL, json=EXAMPLE_SEARCH)


def test_rh_form_validates_data(db, graphql_client):
    ob = _exec_rh_form(graphql_client, firstName="")
    assert len(ob["errors"]) > 0
    assert _get_rh_info(graphql_client) is None


def test_rh_form_saves_data_to_session(db, graphql_client):
    ob = _exec_rh_form(graphql_client)
    assert ob["errors"] == []
    scf = ob["session"]["onboardingScaffolding"]
    assert scf["firstName"] == "Boop"
    assert scf["lastName"] == "Jones"
    assert scf["street"] == "123 Boop Way"
    assert scf["borough"] == "STATEN_ISLAND"
    assert scf["aptNumber"] == "36C"
    assert scf["phoneNumber"] == "2120000000"


def test_rh_form_grabs_rent_stab_info(db, graphql_client, monkeypatch, mock_geocoding_and_nycdb):
    monkeypatch.setattr(
        schema,
        "run_rent_stab_sql_query",
        lambda result: EXAMPLE_RENT_STAB_DATA,
    )
    ob = _exec_rh_form(graphql_client)
    assert ob["errors"] == []
    assert ob["session"]["rentStabInfo"] == {
        "latestYear": "2019",
        "latestUnitCount": 12,
    }


def test_rent_stab_info_is_blank_when_no_rs_data_found(
    db, graphql_client, monkeypatch, mock_geocoding_and_nycdb
):
    monkeypatch.setattr(
        schema,
        "run_rent_stab_sql_query",
        lambda result: None,
    )
    ob = _exec_rh_form(graphql_client)
    assert ob["errors"] == []
    assert ob["session"]["rentStabInfo"] == {
        "latestYear": None,
        "latestUnitCount": None,
    }


def test_rent_stab_info_is_none_when_geocoding_unavailable(db, graphql_client):
    ob = _exec_rh_form(graphql_client)
    assert ob["errors"] == []
    assert ob["session"]["rentStabInfo"] is None


def test_rh_form_saves_info_to_db(db, graphql_client, allow_lambda_http):
    _exec_rh_form(graphql_client)
    graphql_client.execute(RH_EMAIL_MUTATION)
    rhrs = list(RentalHistoryRequest.objects.all())
    assert len(rhrs) == 1
    rhr = rhrs[0]
    assert rhr.first_name == "Boop"
    assert rhr.last_name == "Jones"
    assert rhr.phone_number == "2120000000"
    assert rhr.address == "123 Boop Way"


def test_rh_form_sends_email(db, graphql_client, mailoutbox, allow_lambda_http):
    ob = _exec_rh_form(graphql_client)
    assert ob["errors"] == []
    result = graphql_client.execute(RH_EMAIL_MUTATION)["data"]["rhSendEmail"]
    assert result["errors"] == []
    assert len(mailoutbox) == 1
    msg = mailoutbox[0]
    assert msg.subject == "Request for Rent History"
    assert "I, Boop Jones, am currently living at 123 Boop Way" in msg.body


def test_email_fails_with_no_form_data(db, graphql_client, mailoutbox):
    result = graphql_client.execute(RH_EMAIL_MUTATION)["data"]["rhSendEmail"]
    assert result == {
        "errors": [
            {"field": "__all__", "messages": ["You haven't completed all the previous steps yet."]}
        ],
        "session": None,
    }
    assert len(mailoutbox) == 0


class TestGetSlackNotifyText:
    def test_it_works_for_logged_in_users(self, db):
        rhr = RentalHistoryRequestFactory(user__first_name="Blarf", first_name="Glorp")
        assert get_slack_notify_text(rhr) == (
            f"<https://example.com/admin/users/justfixuser/{rhr.user.pk}/change/|Bip> has "
            f"requested "
            f"<https://example.com/admin/rh/rentalhistoryrequest/{rhr.pk}/change/|rent history>!"
        )

    def test_it_works_for_anonymous_users(self, db):
        rhr = RentalHistoryRequestFactory(user=None, first_name="Glorp & Blorp")
        assert get_slack_notify_text(rhr) == (
            f"Glorp &amp; Blorp has requested "
            f"<https://example.com/admin/rh/rentalhistoryrequest/{rhr.pk}/change/|rent history>!"
        )
