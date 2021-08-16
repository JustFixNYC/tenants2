from evictionfree.cover_letter import CoverLetterVariables
from evictionfree.hardship_declaration import HardshipDeclarationVariables
from django.contrib.auth.models import AnonymousUser
import freezegun
import pytest

from users.models import JustfixUser
from project.schema_base import (
    get_last_queried_phone_number,
    update_last_queried_phone_number,
    PhoneNumberAccountStatus,
)
from loc.tests.factories import LandlordDetailsV2Factory
from onboarding.scaffolding import update_scaffolding, SCAFFOLDING_SESSION_KEY
from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from evictionfree.tests.factories import (
    HardshipDeclarationDetailsFactory,
    SubmittedHardshipDeclarationFactory,
)
from project.util.testing_util import one_field_err


class TestEvictionFreeCreateAccount:
    INCOMPLETE_ERR = [
        {"field": "__all__", "messages": ["You haven't completed all the previous steps yet."]}
    ]

    NYC_SCAFFOLDING = {
        "first_name": "zlorp",
        "last_name": "zones",
        "preferred_first_name": "",
        "city": "New York City",
        "state": "NY",
        "email": "zlorp@zones.com",
        "street": "123 boop way",
        "apt_number": "3B",
        "borough": "MANHATTAN",
    }

    NATIONAL_SCAFFOLDING = {
        "first_name": "boop",
        "last_name": "jones",
        "preferred_first_name": "bip",
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
        assert user.preferred_first_name == "bip"
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
        update_scaffolding(request, self.NYC_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
        assert self.execute()["errors"] == []
        user = JustfixUser.objects.get(phone_number="5551234567")
        assert user.first_name == "zlorp"
        assert user.last_name == "zones"
        assert user.preferred_first_name == ""
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
        assert SCAFFOLDING_SESSION_KEY not in request.session


class TestEvictionFreeSubmitDeclaration:
    QUERY = """
    mutation {
        evictionFreeSubmitDeclaration(input: {}) {
            errors { field, messages }
        }
    }
    """

    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.user = UserFactory(email="boop@jones.net")
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def create_landlord_details(self):
        LandlordDetailsV2Factory(user=self.user, email="landlordo@calrissian.net")

    def execute(self):
        res = self.graphql_client.execute(self.QUERY)
        return res["data"]["evictionFreeSubmitDeclaration"]

    def test_it_requires_login(self):
        self.graphql_client.request.user = AnonymousUser()
        assert self.execute()["errors"] == one_field_err(
            "You do not have permission to use this form!"
        )

    def test_it_raises_err_when_declaration_already_sent(self):
        SubmittedHardshipDeclarationFactory(user=self.user)
        OnboardingInfoFactory(user=self.user)
        assert self.execute()["errors"] == one_field_err(
            "You have already sent a hardship declaration form!"
        )

    def test_it_raises_err_when_no_onboarding_info_exists(self):
        assert self.execute()["errors"] == one_field_err(
            "You haven't provided any account details yet!"
        )

    def test_it_raises_err_when_no_landlord_details_exist(self):
        OnboardingInfoFactory(user=self.user)
        assert self.execute()["errors"] == one_field_err(
            "You haven't provided any landlord details yet!"
        )

    def test_it_raises_err_when_no_hardship_declaration_details_exist(self):
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()["errors"] == one_field_err(
            "You haven't provided details for your hardship declaration form yet!"
        )

    def test_it_raises_err_when_user_is_outside_ny(self):
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user, state="CA")
        assert self.execute()["errors"] == one_field_err(
            "You must be in the state of New York to use this tool!"
        )

    def test_it_raises_err_when_used_on_wrong_site(self):
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        HardshipDeclarationDetailsFactory(user=self.user)
        assert self.execute()["errors"] == one_field_err(
            "This form can only be used from the Eviction Free NY site."
        )

    def test_it_works(
        self,
        use_evictionfree_site,
        fake_fill_hardship_pdf,
        settings,
        allow_lambda_http,
        mailoutbox,
        mocklob,
    ):
        settings.IS_DEMO_DEPLOYMENT = False
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        HardshipDeclarationDetailsFactory(user=self.user)

        with freezegun.freeze_time("2021-01-26"):
            assert self.execute()["errors"] == []

        decl = self.user.submitted_hardship_declaration
        hd_vars = HardshipDeclarationVariables(**decl.declaration_variables)
        cl_vars = CoverLetterVariables(**decl.cover_letter_variables)

        assert cl_vars.date == "01/26/2021"
        assert hd_vars.name == "Boop Jones"
        assert decl.locale == "en"
        assert "Landlordo" in decl.cover_letter_html
        assert decl.mailed_at is not None
        assert decl.emailed_at is not None
        assert decl.emailed_to_housing_court_at is not None
        assert decl.emailed_to_user_at is not None
        assert decl.fully_processed_at is not None
        assert decl.tracking_number == mocklob.sample_letter["tracking_number"]
        assert decl.lob_letter_object is not None

        assert len(mailoutbox) == 3

        ll_mail = mailoutbox[0]
        assert ll_mail.to == ["landlordo@calrissian.net"]
        assert "Hello Landlordo Calrissian" in ll_mail.body

        hc_mail = mailoutbox[1]
        assert hc_mail.to == ["KingsHardshipDeclaration@nycourts.gov"]
        assert "Hello Court Clerk" in hc_mail.body
        assert f"efnyreplies+{self.user.pk}@justfix" in hc_mail.extra_headers["Reply-To"]

        user_mail = mailoutbox[2]
        assert user_mail.to == ["boop@jones.net"]
        assert "PDF of your form" in user_mail.body


class TestHardshipDeclarationVariables:
    QUERY = """
    query {
        output: evictionFreeHardshipDeclarationVariables {
            name,
            countyAndCourt,
            hasFinancialHardship,
            hasHealthRisk,
            address,
            date,
        }
    }
    """

    def test_it_returns_null_for_logged_out_users(self, graphql_client):
        res = graphql_client.execute(self.QUERY)["data"]["output"]
        assert res is None

    def test_it_returns_info_for_valid_users(self, graphql_client, db):
        from .test_hardship_declaration import create_user_with_filled_out_hardship_details

        user = create_user_with_filled_out_hardship_details()
        graphql_client.request.user = user
        with freezegun.freeze_time("2021-01-25"):
            res = graphql_client.execute(self.QUERY)["data"]["output"]
        assert res == {
            "address": "150 court street, Apartment 2, Brooklyn, NY",
            "countyAndCourt": "Bipbop Court, Funkypants County",
            "date": "01/25/2021",
            "hasFinancialHardship": True,
            "hasHealthRisk": False,
            "name": "Boop Jones",
        }
