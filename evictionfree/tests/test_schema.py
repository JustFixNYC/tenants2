import pytest

from users.models import JustfixUser
from project.schema_base import (
    get_last_queried_phone_number,
    update_last_queried_phone_number,
    PhoneNumberAccountStatus,
)
from onboarding.schema import OnboardingStep1Info
from onboarding.tests.test_schema import _exec_onboarding_step_n
from norent.schema import update_scaffolding, SCAFFOLDING_SESSION_KEY


class TestEvictionFreeCreateAccount:
    INCOMPLETE_ERR = [
        {"field": "__all__", "messages": ["You haven't completed all the previous steps yet."]}
    ]

    NYC_SCAFFOLDING = {
        "first_name": "zlorp",
        "last_name": "zones",
        "city": "New York City",
        "state": "NY",
        "email": "zlorp@zones.com",
    }

    NATIONAL_SCAFFOLDING = {
        "first_name": "boop",
        "last_name": "jones",
        "city": "Albany",
        "state": "NY",
        "email": "boop@jones.com",
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
            mutation Create($input: EvictionFreeCreateAccountInput!) {
                output: evictionFreeCreateAccount(input: $input) {
                    errors { field, messages }
                    session {
                        firstName
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

    def test_it_returns_error_when_nyc_addr_but_onboarding_step_1_empty(self):
        self.populate_phone_number()
        update_scaffolding(self.graphql_client.request, self.NYC_SCAFFOLDING)
        assert self.execute()["errors"] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_national_addr_but_incomplete_scaffolding(self):
        self.populate_phone_number()
        scaff = {**self.NATIONAL_SCAFFOLDING, "street": ""}
        update_scaffolding(self.graphql_client.request, scaff)
        assert self.execute()["errors"] == self.INCOMPLETE_ERR

    def test_it_returns_error_when_national_addr_but_no_phone_number(self):
        update_scaffolding(self.graphql_client.request, self.NATIONAL_SCAFFOLDING)
        assert self.execute()["errors"] == self.INCOMPLETE_ERR

    def test_it_works_for_national_users(self):
        request = self.graphql_client.request
        self.populate_phone_number()
        update_scaffolding(request, self.NATIONAL_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
        assert self.execute()["errors"] == []
        user = JustfixUser.objects.get(phone_number="5551234567")
        assert user.first_name == "boop"
        assert user.last_name == "jones"
        assert user.email == "boop@jones.com"
        oi = user.onboarding_info
        assert oi.non_nyc_city == "Albany"
        assert oi.borough == ""
        assert oi.state == "NY"
        assert oi.zipcode == "12345"
        assert oi.address == "1200 Bingy Bingy Way"
        assert oi.apt_number == "5A"
        assert oi.agreed_to_norent_terms is False
        assert oi.agreed_to_justfix_terms is False
        assert oi.agreed_to_evictionfree_terms is True

        assert oi.can_we_sms is True
        assert oi.can_rtc_sms is True
        assert oi.can_hj4a_sms is True

        assert get_last_queried_phone_number(request) is None
        assert SCAFFOLDING_SESSION_KEY not in request.session

    def test_it_works_for_nyc_users(self, smsoutbox, mailoutbox):
        request = self.graphql_client.request
        self.populate_phone_number()
        res = _exec_onboarding_step_n(1, self.graphql_client)
        assert OnboardingStep1Info.get_dict_from_request(request) is not None
        assert res["errors"] == []
        update_scaffolding(request, self.NYC_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
        assert self.execute()["errors"] == []
        user = JustfixUser.objects.get(phone_number="5551234567")
        assert user.first_name == "zlorp"
        assert user.last_name == "zones"
        assert user.email == "zlorp@zones.com"
        oi = user.onboarding_info
        assert oi.non_nyc_city == ""
        assert oi.borough == "MANHATTAN"
        assert oi.state == "NY"
        assert oi.address == "123 boop way"
        assert oi.apt_number == "3B"
        assert oi.agreed_to_norent_terms is False
        assert oi.agreed_to_justfix_terms is False
        assert oi.agreed_to_evictionfree_terms is True

        # This will only get filled out if geocoding is enabled, which it's not.
        assert oi.zipcode == ""

        assert get_last_queried_phone_number(request) is None
        assert OnboardingStep1Info.get_dict_from_request(request) is None
        assert SCAFFOLDING_SESSION_KEY not in request.session
