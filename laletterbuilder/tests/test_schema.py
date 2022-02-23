import pytest

from django.contrib.auth.models import AnonymousUser
from onboarding.tests.factories import OnboardingInfoFactory
from users.models import JustfixUser
from project.schema_base import (
    get_last_queried_phone_number,
    update_last_queried_phone_number,
    PhoneNumberAccountStatus,
)
from onboarding.scaffolding import update_scaffolding, SCAFFOLDING_SESSION_KEY
from users.tests.factories import UserFactory
from laletterbuilder.tests.factories import LandlordDetailsFactory
from project.util.testing_util import one_field_err
import project.locales
from laletterbuilder.models import Letter


DEFAULT_LANDLORD_DETAILS_INPUT = {
    "name": "",
    "primaryLine": "",
    "city": "",
    "state": "",
    "zipCode": "",
    "email": "",
}

EXAMPLE_LANDLORD_DETAILS_INPUT = {
    "name": "Boop Jones",
    "primaryLine": "123 Boop Way",
    "city": "Somewhere",
    "state": "NY",
    "zipCode": "11299",
    "email": "boop@boop.com",
}


def execute_ld_mutation(graphql_client, **input):
    input = {**DEFAULT_LANDLORD_DETAILS_INPUT, **input}
    return graphql_client.execute(
        """
        mutation MyMutation($input: LandlordNameAddressEmailInput!) {
            output: landlordNameAddressEmail(input: $input) {
                errors {
                    field
                    messages
                }
                isUndeliverable,
                session {
                    landlordDetails {
                        name
                        primaryLine
                        city
                        state
                        zipCode
                        email
                    }
                }
            }
        }
        """,
        variables={"input": input},
    )["data"]["output"]


class TestLaLetterBuilderLandlordInfo:
    @pytest.mark.django_db
    def test_landlord_name_address_email_creates_details(self, graphql_client):
        graphql_client.request.user = UserFactory()
        ld_1 = EXAMPLE_LANDLORD_DETAILS_INPUT
        result = execute_ld_mutation(graphql_client, **ld_1)
        assert result["errors"] == []
        assert result["isUndeliverable"] is None
        assert result["session"]["landlordDetails"] == ld_1

    @pytest.mark.django_db
    def test_landlord_name_address_email_requires_fields(self, graphql_client):
        graphql_client.request.user = UserFactory()
        errors = execute_ld_mutation(graphql_client)["errors"]
        expected_errors = 5
        assert len(errors) == expected_errors
        for i in range(expected_errors):
            assert errors[0]["messages"] == ["This field is required."]

    @pytest.mark.django_db
    def test_landlord_details_v2_modifies_existing_details(self, graphql_client):
        ld = LandlordDetailsFactory(is_looked_up=True)
        graphql_client.request.user = ld.user

        assert execute_ld_mutation(graphql_client, name="blop")["errors"][0]["messages"] == [
            "This field is required."
        ]

        ld.refresh_from_db()
        assert ld.is_looked_up is True

        ld_1 = EXAMPLE_LANDLORD_DETAILS_INPUT

        result = execute_ld_mutation(graphql_client, **ld_1)
        assert result["errors"] == []
        assert result["session"]["landlordDetails"] == ld_1

        ld.refresh_from_db()
        assert ld.address == "123 Boop Way\nSomewhere, NY 11299"
        assert ld.is_looked_up is False


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


class TestLaLetterBuilderSendLetter:
    QUERY = """
    mutation {
        laLetterBuilderSendLetter(input: {}) {
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
        LandlordDetailsFactory(user=self.user, email="landlordo@calrissian.net")

    def execute(self):
        res = self.graphql_client.execute(self.QUERY)
        return res["data"]["laLetterBuilderSendLetter"]

    def test_it_requires_login(self):
        self.graphql_client.request.user = AnonymousUser()
        assert self.execute()["errors"] == one_field_err(
            "You do not have permission to use this form!"
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

    def test_it_raises_err_when_used_on_wrong_site(self):
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()["errors"] == one_field_err(
            "This form can only be used from the LA Letter Builder site."
        )

    def test_it_works(
        self,
        allow_lambda_http,
        use_laletterbuilder_site,
        requests_mock,
        mailoutbox,
        smsoutbox,
        settings,
        mocklob,
    ):
        settings.IS_DEMO_DEPLOYMENT = False
        settings.LANGUAGES = project.locales.ALL.choices
        self.user.locale = "es"
        self.user.save()
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        assert self.execute()["errors"] == []

        letter = Letter.objects.get(user=self.graphql_client.request.user)
        assert letter.locale == "es"
        assert (
            "LETTER TEXT" in letter.html_content
        )  # TODO: change this when we get real text in there
        assert "Boop Jones" in letter.html_content
        assert 'lang="en"' in letter.html_content
        assert 'lang="es"' in letter.localized_html_content
        assert letter.letter_sent_at is not None
        assert letter.tracking_number == mocklob.sample_letter["tracking_number"]
        assert letter.fully_processed_at is not None

        assert len(mailoutbox) == 2
        ll_mail = mailoutbox[0]
        assert ll_mail.to == ["landlordo@calrissian.net"]
        assert "letter attached" in ll_mail.body
        assert "Boop Jones" in ll_mail.body
        assert "sent on behalf" in ll_mail.subject
        assert len(ll_mail.attachments) == 1
        assert letter.letter_emailed_at is not None

        user_mail = mailoutbox[1]
        assert user_mail.to == ["boop@jones.net"]
        assert "https://example.com/es/faqs" in user_mail.body
        assert "Hola Boop" in user_mail.body
        assert "Tu carta de NoRent y pasos siguientes importantes" in user_mail.subject

        assert len(smsoutbox) == 1
        assert "Boop Jones" in smsoutbox[0].body
        assert "USPS" in smsoutbox[0].body

        assert len(user_mail.attachments) == 1
