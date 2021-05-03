from unittest.mock import patch
import pytest
from django.contrib.auth.hashers import is_password_usable

import project.locales
from findhelp.tests.factories import CountyFactory
from project.util.testing_util import GraphQLTestingPal
from frontend.tests.util import get_frontend_query
from users.models import JustfixUser
from onboarding.schema import session_key_for_step
from .factories import OnboardingInfoFactory, NationalOnboardingInfoFactory, UserFactory


VALID_STEP_DATA = {
    1: {
        "firstName": "boop",
        "lastName": "jones",
        "address": "123 boop way",
        "borough": "MANHATTAN",
        "aptNumber": "3B",
        "noAptNumber": False,
    },
    3: {"leaseType": "MARKET_RATE", "receivesPublicAssistance": "False"},
    "4Version2": {
        "phoneNumber": "5551234567",
        "canWeSms": True,
        "email": "boop@jones.com",
        "signupIntent": "LOC",
        "password": "blarg1234",
        "confirmPassword": "blarg1234",
        "agreeToTerms": True,
    },
}

ONBOARDING_INFO_QUERY = """
query {
    session {
        onboardingInfo {
            signupIntent
            hasCalled311
            borough
            isInLosAngeles
            leaseType
            state
            city
            fullMailingAddress
            county
        }
    }
}
"""


def _get_step_1_info(graphql_client):
    return graphql_client.execute(
        "query { session { onboardingStep1 { aptNumber, addressVerified } } }"
    )["data"]["session"]["onboardingStep1"]


def _exec_onboarding_step_n(n, graphql_client, **input_kwargs):
    return graphql_client.execute(
        get_frontend_query(f"OnboardingStep{n}Mutation.graphql"),
        variables={"input": {**VALID_STEP_DATA[n], **input_kwargs}},
    )["data"][f"output"]


def test_onboarding_step_1_validates_data(graphql_client):
    ob = _exec_onboarding_step_n(1, graphql_client, firstName="")
    assert len(ob["errors"]) > 0
    assert session_key_for_step(1) not in graphql_client.request.session
    assert _get_step_1_info(graphql_client) is None


def test_onboarding_step_1_works(graphql_client):
    ob = _exec_onboarding_step_n(1, graphql_client)
    expected_data = {**VALID_STEP_DATA[1]}
    del expected_data["noAptNumber"]
    assert ob["errors"] == []
    assert ob["session"]["onboardingStep1"] == expected_data
    assert graphql_client.request.session[session_key_for_step(1)]["apt_number"] == "3B"
    assert _get_step_1_info(graphql_client)["aptNumber"] == "3B"
    assert _get_step_1_info(graphql_client)["addressVerified"] is False

    session_data = graphql_client.request.session[session_key_for_step(1)]
    assert session_data["apt_number"] == "3B"
    assert "no_apt_number" not in session_data


@pytest.mark.django_db
def test_onboarding_step_4_returns_err_if_prev_steps_not_completed(graphql_client):
    result = _exec_onboarding_step_n("4Version2", graphql_client)
    assert result["errors"] == [
        {
            "field": "__all__",
            "extendedMessages": [
                {"message": "You haven't completed all the previous steps yet.", "code": None}
            ],
        }
    ]


def execute_onboarding(graphql_client, step_data=VALID_STEP_DATA):
    for i in step_data.keys():
        result = _exec_onboarding_step_n(i, graphql_client, **step_data[i])
        assert result["errors"] == []
    return result


def test_onboarding_sets_locale(db, graphql_client, settings):
    settings.LANGUAGES = project.locales.ALL.choices
    graphql_client.request.path_info = "/es/graphql"
    execute_onboarding(graphql_client)
    user = JustfixUser.objects.get(phone_number="5551234567")
    assert user.locale == "es"


def test_onboarding_sets_referral(db, graphql_client):
    from partnerships.tests.factories import PartnerOrgFactory
    from partnerships import referral

    partner = PartnerOrgFactory()
    referral.set_partner(graphql_client.request, partner)
    execute_onboarding(graphql_client)
    assert [u.phone_number for u in partner.users.all()] == ["5551234567"]


@pytest.mark.django_db
def test_onboarding_works(graphql_client, smsoutbox, mailoutbox):
    result = execute_onboarding(graphql_client)

    for i in [1, 3]:
        assert result["session"][f"onboardingStep{i}"] is None
    assert result["session"]["phoneNumber"] == "5551234567"

    request = graphql_client.request
    user = JustfixUser.objects.get(phone_number="5551234567")
    oi = user.onboarding_info
    assert user.full_legal_name == "boop jones"
    assert user.email == "boop@jones.com"
    assert user.pk == request.user.pk
    assert user.locale == "en"
    assert is_password_usable(user.password) is True
    assert oi.address == "123 boop way"
    assert oi.borough == "MANHATTAN"
    assert oi.state == "NY"
    assert oi.needs_repairs is None
    assert oi.lease_type == "MARKET_RATE"
    assert oi.receives_public_assistance is False
    assert oi.agreed_to_justfix_terms is True
    assert oi.agreed_to_norent_terms is False
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == "+15551234567"
    assert "Welcome to JustFix.nyc, boop" in smsoutbox[0].body
    assert len(mailoutbox) == 1
    assert "verify your email" in mailoutbox[0].subject


@pytest.mark.django_db
def test_onboarding_info_is_none_when_it_does_not_exist(graphql_client):
    result = graphql_client.execute(ONBOARDING_INFO_QUERY)["data"]["session"]
    assert result["onboardingInfo"] is None


@pytest.mark.django_db
def test_onboarding_info_is_present_when_it_exists(graphql_client):
    execute_onboarding(graphql_client)
    result = graphql_client.execute(ONBOARDING_INFO_QUERY)["data"]["session"]
    assert result["onboardingInfo"]["signupIntent"] == "LOC"


@pytest.mark.django_db
def test_has_called_311_works(graphql_client):
    def query():
        result = graphql_client.execute(ONBOARDING_INFO_QUERY)["data"]["session"]
        return result["onboardingInfo"]["hasCalled311"]

    onb = OnboardingInfoFactory(has_called_311=None)
    graphql_client.request.user = onb.user
    assert query() is None

    onb.has_called_311 = True
    onb.save()
    assert query() is True


def test_full_mailing_address_works(db, graphql_client):
    onb = OnboardingInfoFactory()
    graphql_client.request.user = onb.user
    result = graphql_client.execute(ONBOARDING_INFO_QUERY)["data"]["session"]
    result = result["onboardingInfo"]["fullMailingAddress"]
    assert result == "150 court street\nApartment 2\nBrooklyn, NY"


def test_county_works(db, graphql_client):
    def query():
        result = graphql_client.execute(ONBOARDING_INFO_QUERY)["data"]["session"]
        return result["onboardingInfo"]["county"]

    onb = OnboardingInfoFactory()
    graphql_client.request.user = onb.user
    assert query() is None

    CountyFactory()
    OnboardingInfoFactory.set_geocoded_point(onb, 0.1, 0.1)
    onb.save()
    assert query() == "Funkypants"


def test_onboarding_session_info_is_fault_tolerant(graphql_client):
    key = session_key_for_step(1)
    graphql_client.request.session[key] = {"lol": 1}

    with patch("project.util.django_graphql_session_forms.logger") as m:
        assert _get_step_1_info(graphql_client) is None
        m.exception.assert_called_once_with(f"Error deserializing {key} from session")
        assert key not in graphql_client.request.session


def test_onboarding_session_info_returns_city_and_state(db, graphql_client):
    onb = OnboardingInfoFactory()
    graphql_client.request.user = onb.user
    result = graphql_client.execute(ONBOARDING_INFO_QUERY)
    info = result["data"]["session"]["onboardingInfo"]
    assert info["city"] == "Brooklyn"
    assert info["state"] == "NY"


def test_onboarding_session_info_works_with_blank_values(db, graphql_client):
    def query():
        result = graphql_client.execute(ONBOARDING_INFO_QUERY)
        return result["data"]["session"]["onboardingInfo"]

    onb = OnboardingInfoFactory(borough="", lease_type="")
    graphql_client.request.user = onb.user
    result = query()
    assert result["borough"] is None
    assert result["leaseType"] is None
    assert result["isInLosAngeles"] is None

    onb.borough = "BROOKLYN"
    onb.lease_type = "NYCHA"
    onb.zipcode = "90012"
    result = query()
    assert result["borough"] == "BROOKLYN"
    assert result["leaseType"] == "NYCHA"
    assert result["isInLosAngeles"] is True


class TestAgreeToTerms(GraphQLTestingPal):
    QUERY = """
    mutation AgreeToTermsMutation($input: AgreeToTermsInput!) {
        output: agreeToTerms(input: $input) {
            errors { field, messages },
            session { onboardingInfo {
                agreedToJustfixTerms,
                agreedToNorentTerms,
                agreedToEvictionfreeTerms
            } }
        }
    }
    """

    DEFAULT_INPUT = {"site": "JUSTFIX", "agreeToTerms": True}

    @pytest.fixture
    def logged_in(self):
        self.oi = OnboardingInfoFactory(agreed_to_justfix_terms=False)
        self.request.user = self.oi.user

    def test_it_raises_err_when_not_logged_in(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    def test_it_raises_err_when_checkbox_not_checked(self, logged_in):
        self.assert_one_field_err(
            "This field is required.",
            "agreeToTerms",
            input={
                "agreeToTerms": False,
            },
        )

    def test_it_works_with_justfix_site(self, logged_in):
        res = self.execute()
        assert res["errors"] == []
        assert res["session"]["onboardingInfo"] == {
            "agreedToJustfixTerms": True,
            "agreedToNorentTerms": False,
            "agreedToEvictionfreeTerms": False,
        }

    def test_it_works_with_norent_site(self, logged_in):
        res = self.execute(input={"site": "NORENT"})
        assert res["errors"] == []
        assert res["session"]["onboardingInfo"] == {
            "agreedToJustfixTerms": False,
            "agreedToNorentTerms": True,
            "agreedToEvictionfreeTerms": False,
        }
        self.oi.refresh_from_db()
        assert self.oi.agreed_to_norent_terms is True

    def test_it_works_with_evictionfree_site(self, logged_in):
        res = self.execute(input={"site": "EVICTIONFREE"})
        assert res["errors"] == []
        assert res["session"]["onboardingInfo"] == {
            "agreedToJustfixTerms": False,
            "agreedToNorentTerms": False,
            "agreedToEvictionfreeTerms": True,
        }
        self.oi.refresh_from_db()
        assert self.oi.agreed_to_evictionfree_terms is True


class TestLeaseType(GraphQLTestingPal):
    QUERY = """
    mutation LeaseTypeMutation($input: LeaseTypeInput!) {
        output: leaseType(input: $input) {
            errors { field, messages },
            session { onboardingInfo {
                leaseType
            } }
        }
    }
    """

    DEFAULT_INPUT = {"leaseType": "NYCHA"}

    def test_it_raises_err_when_not_logged_in(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    def test_it_raises_err_when_not_onboarded(self):
        self.set_user(UserFactory())
        self.assert_one_field_err("You haven't provided any account details yet!")

    def test_it_works(self):
        oi = OnboardingInfoFactory(lease_type="RENT_STABILIZED")
        self.set_user(oi.user)
        assert self.execute() == {
            "errors": [],
            "session": {"onboardingInfo": {"leaseType": "NYCHA"}},
        }
        assert oi.lease_type == "NYCHA"


class TestNycAddress(GraphQLTestingPal):
    QUERY = """
    mutation NycAddressMutation($input: NycAddressInput!) {
        output: nycAddress(input: $input) {
            errors { field, messages },
            session { onboardingInfo {
                address,
                borough,
                aptNumber
            } }
        }
    }
    """

    DEFAULT_INPUT = {
        "address": "654 park place",
        "borough": "BROOKLYN",
        "aptNumber": "2",
        "noAptNumber": False,
    }

    _expected_default_output = {
        "errors": [],
        "session": {
            "onboardingInfo": {
                "address": "654 park place",
                "borough": "BROOKLYN",
                "aptNumber": "2",
            }
        },
    }

    def test_it_raises_err_when_not_logged_in(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    def test_it_works_when_geocoding_fails(self):
        oi = OnboardingInfoFactory(
            address="123 boop street", borough="QUEENS", apt_number="", address_verified=True
        )
        self.set_user(oi.user)
        assert self.execute() == self._expected_default_output
        assert oi.address == "654 park place"
        assert oi.address_verified is False

    def test_it_works_when_switching_from_non_nyc_address(self):
        oi = NationalOnboardingInfoFactory()
        self.set_user(oi.user)
        assert self.execute() == self._expected_default_output
        assert oi.non_nyc_city == ""
        assert oi.state == "NY"


class TestPublicAssistance(GraphQLTestingPal):
    QUERY = """
    mutation PublicAssistanceMutation($input: PublicAssistanceInput!) {
        output: publicAssistance(input: $input) {
            errors { field, messages },
            session { onboardingInfo {
                receivesPublicAssistance,
            } }
        }
    }
    """

    DEFAULT_INPUT = {
        "receivesPublicAssistance": "True",
    }

    def test_it_raises_err_when_not_logged_in(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    def test_it_works(self):
        oi = OnboardingInfoFactory(receives_public_assistance=False)
        self.set_user(oi.user)
        assert self.execute() == {
            "errors": [],
            "session": {"onboardingInfo": {"receivesPublicAssistance": True}},
        }
        oi.refresh_from_db()
        assert oi.receives_public_assistance is True
