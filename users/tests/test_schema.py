from project.util import phone_number
import pytest

from .factories import UserFactory
from project.util.testing_util import GraphQLTestingPal


class TestSendVerificationEmail:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client):
        self.graphql_client = graphql_client

    def execute(self, user, email):
        if user:
            self.graphql_client.request.user = user
        return self.graphql_client.execute(
            """
            mutation {
                sendVerificationEmail(input:{email: "%s"}) {
                    errors { field, messages },
                    session { email, isEmailVerified }
                }
            }
            """
            % email
        )["data"]["sendVerificationEmail"]

    def test_it_requires_login(self):
        assert self.execute(None, "boop@jones.com")["errors"] == [
            {"field": "__all__", "messages": ["You do not have permission to use this form!"]}
        ]

    def test_does_not_reset_verified_when_email_is_unchanged(self, db, mailoutbox):
        user = UserFactory(email="boop@jones.com", is_email_verified=True)
        assert self.execute(user, "boop@jones.com") == {
            "errors": [],
            "session": {"email": "boop@jones.com", "isEmailVerified": True},
        }
        assert len(mailoutbox) == 1
        assert mailoutbox[0].recipients() == ["boop@jones.com"]

    def test_it_resets_verified_when_email_changes(self, db, mailoutbox):
        user = UserFactory(email="old@email.com", is_email_verified=True)
        assert self.execute(user, "blap@jones.com") == {
            "errors": [],
            "session": {"email": "blap@jones.com", "isEmailVerified": False},
        }
        assert len(mailoutbox) == 1
        assert mailoutbox[0].recipients() == ["blap@jones.com"]


class TestPhoneNumber(GraphQLTestingPal):
    QUERY = """
    mutation PhoneNumber($input: PhoneNumberInput!) {
        output: phoneNumber(input: $input) {
            errors { field, messages },
            session { phoneNumber }
        }
    }
    """

    DEFAULT_INPUT = {
        "phoneNumber": "",
    }

    def test_it_requires_login(self):
        self.assert_one_field_err("You do not have permission to use this form!")

    def test_it_works(self):
        user = UserFactory(phone_number="5551234567")
        self.set_user(user)
        res = self.execute({"phoneNumber": "6149951231"})
        assert res == {"errors": [], "session": {"phoneNumber": "6149951231"}}
        user.refresh_from_db()
        assert user.phone_number == "6149951231"
