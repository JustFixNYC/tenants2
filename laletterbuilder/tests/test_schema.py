import pytest

from users.models import JustfixUser
from project.schema_base import (
    get_last_queried_phone_number,
    update_last_queried_phone_number,
    PhoneNumberAccountStatus,
)
from onboarding.scaffolding import update_scaffolding, SCAFFOLDING_SESSION_KEY


class TestLaLetterBuilderCreateAccount:
    INCOMPLETE_ERR = [
        {"field": "__all__", "messages": ["You haven't completed all the previous steps yet."]}
    ]

    LA_SCAFFOLDING = {
        "first_name": "zanet",
        "last_name": "zones",
        "preferred_first_name": "bip",
        "city": "Los Angeles",
        "state": "CA",
        "email": "zanet@zones.com",
        "street": "1200 Bingy Bingy Way",
        "apt_number": "5A",
        "zip_code": "12345",
    }

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client):
        self.graphql_client = graphql_client

    def execute(self):
        input = {
            "password": "blarg1234",
            "confirmPassword": "blarg1234",
            "agreeToTerms": True,
            "canWeSms": True,
        }

        return self.graphql_client.execute(
            """
            mutation Create($input: LaLetterBuilderCreateAccountInput!) {
                output: laLetterBuilderCreateAccount(input: $input) {
                    errors { field, messages }
                    session {
                        firstName,
                        preferredFirstName
                    }
                }
            }
            """,
            variables={"input": input},
        )["data"]["output"]

    def populate_phone_number(self):
        update_last_queried_phone_number(
            self.graphql_client.request, "5551234567", PhoneNumberAccountStatus.NO_ACCOUNT
        )

    def test_it_returns_error_when_session_is_empty(self):
        assert self.execute()["errors"] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_only_phone_number_is_in_session(self):
        self.populate_phone_number()
        assert self.execute()["errors"] == self.INCOMPLETE_ERR

    # TODO: add a test for if they have an address but nothing else in the session
    # (once we require more)
    # TODO: Make sure if users are outside LA it returns the correct kind of error

    def test_it_works_for_la_users(self, smsoutbox, mailoutbox):
        request = self.graphql_client.request
        self.populate_phone_number()
        update_scaffolding(request, self.LA_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
        assert self.execute()["errors"] == []
        user = JustfixUser.objects.get(phone_number="5551234567")
        assert user.first_name == "zanet"
        assert user.last_name == "zones"
        assert user.email == "zanet@zones.com"
        oi = user.onboarding_info
        assert oi.non_nyc_city == "Los Angeles"
        assert oi.state == "CA"
        assert oi.address == "1200 Bingy Bingy Way"
        assert oi.apt_number == "5A"
        assert oi.agreed_to_norent_terms is False
        assert oi.agreed_to_justfix_terms is False
        assert oi.agreed_to_evictionfree_terms is False
        assert oi.agreed_to_laletterbuilder_terms is True
        assert oi.zipcode == "12345"

        assert get_last_queried_phone_number(request) is None
        assert SCAFFOLDING_SESSION_KEY not in request.session
