from typing import Dict
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
from users.tests.factories import SecondUserFactory, UserFactory
from laletterbuilder.tests.factories import HabitabilityLetterFactory, LandlordDetailsFactory
from project.util.testing_util import one_field_err
import project.locales
from laletterbuilder.models import HabitabilityLetter


DEFAULT_LANDLORD_DETAILS_INPUT = {
    "name": "",
    "primaryLine": "",
    "city": "",
    "state": "",
    "zipCode": "",
}

EXAMPLE_LANDLORD_DETAILS_INPUT = {
    "name": "Boop Jones",
    "primaryLine": "123 Boop Way",
    "city": "Somewhere",
    "state": "NY",
    "zipCode": "11299",
}


def execute_ld_mutation(graphql_client, **input):
    input = {**DEFAULT_LANDLORD_DETAILS_INPUT, **input}
    return graphql_client.execute(
        """
        mutation MyMutation($input: LandlordNameAddressInput!) {
            output: landlordNameAddress(input: $input) {
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
                    }
                }
            }
        }
        """,
        variables={"input": input},
    )["data"]["output"]


class TestLaLetterBuilderLandlordInfo:
    @pytest.mark.django_db
    def test_landlord_name_address_creates_details(self, graphql_client):
        graphql_client.request.user = UserFactory()
        ld_1 = EXAMPLE_LANDLORD_DETAILS_INPUT
        result = execute_ld_mutation(graphql_client, **ld_1)
        assert result["errors"] == []
        assert result["isUndeliverable"] is None
        assert result["session"]["landlordDetails"] == ld_1

    @pytest.mark.django_db
    def test_landlord_name_address_requires_fields(self, graphql_client):
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
        "street": "1200 Bingy Bingy Way",
        "apt_number": "5A",
        "zip_code": "12345",
    }

    INPUT_WITHOUT_EMAIL = {
        "password": "blarg1234",
        "confirmPassword": "blarg1234",
        "email": "",
        "agreeToTerms": True,
        "canWeSms": True,
    }

    INPUT_WITH_EMAIL: Dict[str, object] = {
        **INPUT_WITHOUT_EMAIL,
        "email": "zanet@zones.com",
    }

    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client):
        self.graphql_client = graphql_client

    def execute(self, input=INPUT_WITH_EMAIL):
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

    def test_it_creates_account_without_email_required(self, smsoutbox, mailoutbox):
        request = self.graphql_client.request
        self.populate_phone_number()
        update_scaffolding(request, self.LA_SCAFFOLDING)
        assert SCAFFOLDING_SESSION_KEY in request.session
        assert self.execute(self.INPUT_WITHOUT_EMAIL)["errors"] == []
        user = JustfixUser.objects.get(phone_number="5551234567")
        assert user.email == ""


class TestLaLetterBuilderSendLetter:
    SEND_QUERY = """
    mutation laLetterBuilderSendLetter($input: LaLetterBuilderSendLetterInput!) {
        output: laLetterBuilderSendLetter(input: $input) {
            errors { field, messages },
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

    def execute(self, input={}):
        res = self.graphql_client.execute(
            self.SEND_QUERY,
            variables={"input": input},
        )
        return res["data"]["output"]

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

    @pytest.mark.django_db
    def test_it_sends_letter(
        self,
        settings,
        allow_lambda_http,
        use_laletterbuilder_site,
        requests_mock,
        mailoutbox,
        smsoutbox,
        mocklob,
        db,
    ):
        user = self.graphql_client.request.user
        settings.IS_DEMO_DEPLOYMENT = False
        settings.LANGUAGES = project.locales.ALL.choices
        self.user.locale = "es"
        self.user.save()
        self.create_landlord_details()
        OnboardingInfoFactory(user=self.user)
        letter_obj = HabitabilityLetter(user=user, locale="es", html_content="<test/>")
        letter_obj.save()

        blank_letter = HabitabilityLetter.objects.get(
            user=user, letter_sent_at=None, letter_emailed_at=None
        )
        assert blank_letter.html_content == "<test/>"

        # Send the letter
        assert self.execute()["errors"] == []

        sent_letter = HabitabilityLetter.objects.get(user=self.graphql_client.request.user)
        assert (
            "repairs in my home" in sent_letter.html_content
        )  # TODO: change this when we get real text in there
        assert "Boop Jones" in sent_letter.html_content
        assert 'lang="en"' in sent_letter.html_content
        assert 'lang="es"' in sent_letter.localized_html_content

        # TODO: add tests for landlord email and user email after implementing
        # (see NoRent test_schema.py)

        # TODO: add test for actual letter being sent, slack message being sent, etc.


class TestLaLetterBuilderCreateLetter:
    QUERY = """
        mutation LaLetterBuilderCreateLetterMutation($input: LaLetterBuilderCreateLetterInput!) {
            output: laLetterBuilderCreateLetter(input: $input) {
                errors { field, messages },
            }
        }
    """

    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.user = UserFactory(email="boop@jones.net")
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def execute(self, input={}):
        res = self.graphql_client.execute(
            self.QUERY,
            variables={"input": input},
        )
        return res["data"]["output"]

    def test_it_requires_login(self):
        self.graphql_client.request.user = AnonymousUser()
        assert self.execute()["errors"] == one_field_err(
            "You do not have permission to use this form!"
        )

    def test_it_raises_err_when_no_onboarding_info_exists(self):
        assert self.execute()["errors"] == one_field_err(
            "You haven't provided any account details yet!"
        )

    def test_it_raises_err_when_used_on_wrong_site(self):
        OnboardingInfoFactory(user=self.user)
        assert self.execute()["errors"] == one_field_err(
            "This form can only be used from the LA Letter Builder site."
        )

    def test_it_creates_letter(
        self,
        settings,
        use_laletterbuilder_site,
    ):
        settings.IS_DEMO_DEPLOYMENT = False
        settings.LANGUAGES = project.locales.ALL.choices
        self.user.locale = "es"
        self.user.save()
        OnboardingInfoFactory(user=self.user)

        assert not HabitabilityLetter.objects.filter(user=self.graphql_client.request.user).exists()

        # Create the letter
        assert self.execute()["errors"] == []

        # TODO: add tests for all the other kinds of letters too
        letter = HabitabilityLetter.objects.get(user=self.graphql_client.request.user)
        assert letter.locale == "es"
        assert letter.html_content == "<>"
        assert letter.mail_choice == "WE_WILL_MAIL"

        # TODO: add tests for user email after implementing
        # (see NoRent test_schema.py)


class TestLaLetterBuilderIssuesMutation:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.user = UserFactory(email="boop@jones.net")
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def execute(self, input):
        return self.graphql_client.execute(
            """
            mutation MyMutation($input: LaLetterBuilderIssuesInput!) {
                laLetterBuilderIssues(input: $input) {
                    errors {
                        field
                        messages
                    }
                    session {
                        laIssues
                    }
                }
            }
            """,
            variables={"input": input},
        )["data"]["laLetterBuilderIssues"]

    def test_it_requires_login(self):
        self.graphql_client.request.user = AnonymousUser()
        result = self.execute({"laIssues": ["HEALTH__MOLD__BEDROOM"]})
        assert result["errors"] == [
            {"field": "__all__", "messages": ["You do not have permission to use this form!"]}
        ]

    def test_it_raises_err_when_no_onboarding_info_exists(self):
        result = self.execute({"laIssues": ["HEALTH__MOLD__BEDROOM"]})
        assert result["errors"] == [
            {"field": "__all__", "messages": ["You haven't provided any account details yet!"]}
        ]

    @pytest.mark.django_db
    def test_it_raises_err_when_no_letter_exists(self):
        OnboardingInfoFactory(user=self.user)
        result = self.execute({"laIssues": ["HEALTH__MOLD__BEDROOM"]})
        assert result["errors"] == [
            {
                "field": "__all__",
                "messages": ["Could not find an unsent habitability letter for user boop"],
            }
        ]

    @pytest.mark.django_db
    def test_it_raises_err_when_multiple_unsent_letter_exists(self):
        OnboardingInfoFactory(user=self.user)
        HabitabilityLetterFactory(user=self.user)
        HabitabilityLetterFactory(user=self.user)

        result = self.execute({"laIssues": ["HEALTH__MOLD__BEDROOM"]})
        assert result["errors"] == [
            {
                "field": "__all__",
                "messages": [
                    "Found multiple unsent habitability letters for boop. "
                    + "There should only ever be one."
                ],
            }
        ]

    @pytest.mark.django_db
    def test_it_saves_new_issues_and_deletes_old_ones(self, db):
        OnboardingInfoFactory(user=self.user)
        HabitabilityLetterFactory(user=self.user)

        result = self.execute({"laIssues": ["HEALTH__MOLD__BEDROOM"]})

        assert result["errors"] == []
        assert result["session"]["laIssues"] == ["HEALTH__MOLD__BEDROOM"]

        result = self.execute(
            {
                "laIssues": [],
            }
        )
        assert result["errors"] == []
        assert result["session"]["laIssues"] == []

    @pytest.mark.django_db
    def test_issues_is_empty_when_unauthenticated(self, db):
        result = self.graphql_client.execute("query { session { laIssues } }")
        assert result["data"]["session"]["laIssues"] == []


class TestHabitabilityLatestLetter:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.letter = HabitabilityLetterFactory(tracking_number="abcd")
        self.graphql_client = graphql_client

    def execute(self):
        res = self.graphql_client.execute(
            "query { session { habitabilityLatestLetter { trackingNumber }} }"
        )
        return res["data"]["session"]["habitabilityLatestLetter"]

    def test_it_returns_none_if_not_logged_in(self):
        assert self.execute() is None

    def test_it_returns_none_if_no_letters_exist_for_user(self):
        self.graphql_client.request.user = SecondUserFactory()
        assert self.execute() is None

    def test_it_returns_letter_if_one_exists_for_user(self):
        self.graphql_client.request.user = self.letter.user
        assert self.execute()["trackingNumber"] == "abcd"


class TestLaLetterBuilderSendOptionsMutation:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.user = UserFactory(email="boop2@jones.net")
        graphql_client.request.user = self.user
        self.graphql_client = graphql_client

    def execute(self, input):
        return self.graphql_client.execute(
            """
            mutation MyMutation($input: LaLetterBuilderSendOptionsInput!) {
                output: laLetterBuilderSendOptions(input: $input) {
                    errors {
                        field
                        messages
                    }
                    session {
                        habitabilityLatestLetter {
                            mailChoice
                        }
                        landlordDetails {
                            email
                        }
                    }
                }
            }
            """,
            variables={"input": input},
        )["data"]["output"]

    @pytest.mark.django_db
    def test_it_saves_landlord_email_and_mail_choice(self, db):
        OnboardingInfoFactory(user=self.user)
        HabitabilityLetterFactory(user=self.user)
        LandlordDetailsFactory(user=self.user)

        result = self.execute({
            "email": "landlord@boop.com",
            "mailChoice": "USER_WILL_MAIL",
        })

        assert result["errors"] == []
        assert result["session"]["landlordDetails"]["email"] == "landlord@boop.com"
        assert result["session"]["habitabilityLatestLetter"]["mailChoice"] == "USER_WILL_MAIL"
