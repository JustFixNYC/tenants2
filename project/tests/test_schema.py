import pytest

from users.models import JustfixUser
from users.tests.factories import UserFactory
from project.util import schema_json
from frontend.tests.util import get_frontend_query

EXAMPLE_DEPRECATED_FIELD = "exampleDeprecatedField"


@pytest.mark.django_db
def test_login_works(graphql_client):
    user = UserFactory(phone_number="5551234567", password="blarg")
    result = graphql_client.execute(
        get_frontend_query("LoginMutation.graphql"),
        variables={"input": {"phoneNumber": "5551234567", "password": "blarg"}},
    )

    login = result["data"]["output"]
    assert login["errors"] == []
    assert len(login["session"]["csrfToken"]) > 0
    assert graphql_client.request.user.pk == user.pk
    assert graphql_client.request.session.get_expire_at_browser_close() is False


@pytest.mark.django_db
def test_logout_works(graphql_client):
    user = UserFactory()
    graphql_client.request.user = user
    logout_mutation = get_frontend_query("LogoutMutation.graphql")
    result = graphql_client.execute(logout_mutation, variables={"input": {}})
    assert len(result["data"]["output"]["session"]["csrfToken"]) > 0
    assert graphql_client.request.user.pk is None
    assert graphql_client.request.session.get_expire_at_browser_close() is True


class TestClearAnonymousSession:
    QUERY = "mutation { output: clearAnonymousSession(input: {}) { session { csrfToken } } }"

    def test_it_does_nothing_if_user_is_logged_in(self, db, graphql_client):
        user = UserFactory()
        graphql_client.request.user = user
        graphql_client.request.session["boop"] = 1
        result = graphql_client.execute(self.QUERY)
        assert len(result["data"]["output"]["session"]["csrfToken"]) > 0
        assert graphql_client.request.user.pk == user.pk
        assert graphql_client.request.session["boop"] == 1

    def test_it_clears_session_if_it_is_anonymous(self, db, graphql_client):
        graphql_client.request.session["boop"] = 1
        result = graphql_client.execute(self.QUERY)
        assert len(result["data"]["output"]["session"]["csrfToken"]) > 0
        assert graphql_client.request.user.pk is None
        assert "boop" not in graphql_client.request.session


def test_deprecated_field_is_not_in_session_query():
    all_session_info = get_frontend_query("AllSessionInfo.graphql")
    assert EXAMPLE_DEPRECATED_FIELD not in all_session_info


def test_deprecated_field_can_be_queried(graphql_client):
    result = graphql_client.execute("query { session { %s } }" % EXAMPLE_DEPRECATED_FIELD)
    assert result["data"]["session"][EXAMPLE_DEPRECATED_FIELD] is None


class TestPasswordReset:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, smsoutbox, db, monkeypatch):
        self.graphql_client = graphql_client
        self.smsoutbox = smsoutbox
        monkeypatch.setattr(
            "project.password_reset.get_random_string", self._fake_get_random_string
        )

    def _fake_get_random_string(self, length, allowed_chars):
        assert length == 6
        assert allowed_chars == "0123456789"
        return "123456"

    def mutate_password_reset_confirm(
        self, password="my_new_pw1234", confirm_password="my_new_pw1234"
    ):
        result = self.graphql_client.execute(
            """
            mutation {
                passwordResetConfirm(input: {
                    password: "%s",
                    confirmPassword: "%s"
                }) {
                    errors {
                        field,
                        messages
                    }
                }
            }
            """
            % (password, confirm_password)
        )
        return result["data"]["passwordResetConfirm"]["errors"]

    def mutate_password_reset_confirm_and_login(
        self, password="my_new_pw1234", confirm_password="my_new_pw1234"
    ):
        result = self.graphql_client.execute(
            """
            mutation {
                passwordResetConfirmAndLogin(input: {
                    password: "%s",
                    confirmPassword: "%s"
                }) {
                    errors {
                        field,
                        messages
                    }
                    session {
                        phoneNumber
                    }
                }
            }
            """
            % (password, confirm_password)
        )
        return result["data"]["passwordResetConfirmAndLogin"]

    def mutate_password_reset_verification_code(self):
        result = self.graphql_client.execute(
            """
            mutation {
                passwordResetVerificationCode(input: {code: "123456"}) {
                    errors {
                        field,
                        messages
                    }
                }
            }
            """
        )
        return result["data"]["passwordResetVerificationCode"]["errors"]

    def mutate_password_reset(self):
        result = self.graphql_client.execute(
            """
            mutation {
                passwordReset(input: {phoneNumber: "5551234567"}) {
                    errors {
                        field,
                        messages
                    }
                }
            }
            """
        )
        return result["data"]["passwordReset"]["errors"]

    def test_it_does_nothing_on_bad_phone_number(self):
        assert self.mutate_password_reset() == []
        assert len(self.smsoutbox) == 0

    def test_it_sends_sms_on_success(self):
        UserFactory(phone_number="5551234567")
        assert self.mutate_password_reset() == []
        assert len(self.smsoutbox) == 1
        msg = self.smsoutbox[0]
        assert msg.to == "+15551234567"
        assert "Your verification code is 123456" in msg.body

    def test_entire_reset_process_works(self):
        user = UserFactory(phone_number="5551234567")
        assert self.mutate_password_reset() == []
        assert self.mutate_password_reset_verification_code() == []
        assert self.mutate_password_reset_confirm() == []
        user.refresh_from_db()
        assert user.check_password("my_new_pw1234") is True

    def test_entire_reset_process_with_login_works(self):
        user = UserFactory(phone_number="5551234567")
        assert self.mutate_password_reset() == []
        assert self.mutate_password_reset_verification_code() == []
        assert self.mutate_password_reset_confirm_and_login() == {
            "errors": [],
            "session": {"phoneNumber": "5551234567"},
        }
        user.refresh_from_db()
        assert user.check_password("my_new_pw1234") is True

    def test_password_field_is_required(self):
        assert "This field is required" in repr(self.mutate_password_reset_confirm("", ""))

    def test_confirm_raises_errors(self):
        assert "Please go back" in repr(self.mutate_password_reset_confirm())

    def test_confirm_and_login_raises_errors(self):
        assert "Please go back" in repr(self.mutate_password_reset_confirm_and_login())

    def test_verification_raises_errors(self):
        assert "Incorrect verification" in repr(self.mutate_password_reset_verification_code())


def test_schema_json_is_up_to_date():
    err_msg = (
        f"{schema_json.FILENAME} is out of date! "
        f'Please run "{schema_json.REBUILD_CMDLINE}" to rebuild it.'
    )

    if not schema_json.is_up_to_date():
        raise Exception(err_msg)


def test_is_staff_works(graphql_client):
    def get_is_staff():
        result = graphql_client.execute("query { session { isStaff } }")
        return result["data"]["session"]["isStaff"]

    assert get_is_staff() is False, "anonymous user is not staff"

    graphql_client.request.user = UserFactory.build(is_staff=False)
    assert get_is_staff() is False

    graphql_client.request.user = UserFactory.build(is_staff=True)
    assert get_is_staff() is True


def test_first_and_last_name_works(graphql_client):
    def get():
        result = graphql_client.execute("query { session { firstName, lastName } }")
        sess = result["data"]["session"]
        return (sess["firstName"], sess["lastName"])

    assert get() == (None, None), "anonymous user has no first/last name"

    graphql_client.request.user = UserFactory.build(full_legal_name="Boop Jones")
    assert get() == ("Boop", "Jones")


def test_email_fields_work(graphql_client):
    def get():
        result = graphql_client.execute("query { session { email, isEmailVerified } }")
        sess = result["data"]["session"]
        return (sess["email"], sess["isEmailVerified"])

    assert get() == (None, None), "anonymous user has no email info"

    graphql_client.request.user = UserFactory.build(email="boop@jones.com", is_email_verified=True)
    assert get() == ("boop@jones.com", True)


def test_user_id_works(graphql_client, db):
    def get():
        result = graphql_client.execute("query { session { userId } }")
        return result["data"]["session"]["userId"]

    assert get() is None, "anonymous user has no user ID"

    user = UserFactory()
    assert user.pk is not None
    graphql_client.request.user = user
    assert get() == user.pk


class TestQueryOrVerifyPhoneNumber:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, graphql_client, smsoutbox):
        self.graphql_client = graphql_client
        self.smsoutbox = smsoutbox

    def execute(self, phone_number):
        return self.graphql_client.execute(
            """
            mutation {
                queryOrVerifyPhoneNumber(input: {phoneNumber: "%s"}) {
                    errors { field, messages }
                    accountStatus
                    session { lastQueriedPhoneNumber, lastQueriedPhoneNumberAccountStatus }
                }
            }
            """
            % phone_number
        )["data"]["queryOrVerifyPhoneNumber"]

    def test_it_returns_no_account(self):
        result = self.execute("5551234567")
        assert result == {
            "accountStatus": "NO_ACCOUNT",
            "errors": [],
            "session": {
                "lastQueriedPhoneNumber": "5551234567",
                "lastQueriedPhoneNumberAccountStatus": "NO_ACCOUNT",
            },
        }
        assert len(self.smsoutbox) == 0

    def test_it_returns_form_errors(self):
        result = self.execute("bleh")
        assert result["accountStatus"] is None
        assert result["errors"] != []
        assert len(self.smsoutbox) == 0

    def test_it_returns_account(self):
        UserFactory(phone_number="5551234567")
        result = self.execute("5551234567")
        assert result == {
            "accountStatus": "ACCOUNT_WITH_PASSWORD",
            "errors": [],
            "session": {
                "lastQueriedPhoneNumber": "5551234567",
                "lastQueriedPhoneNumberAccountStatus": "ACCOUNT_WITH_PASSWORD",
            },
        }
        assert len(self.smsoutbox) == 0

    def test_it_returns_account_without_password_and_sends_code(self):
        JustfixUser.objects.create_user(username="blarg", phone_number="5551234567", password=None)
        result = self.execute("5551234567")
        assert result == {
            "accountStatus": "ACCOUNT_WITHOUT_PASSWORD",
            "errors": [],
            "session": {
                "lastQueriedPhoneNumber": "5551234567",
                "lastQueriedPhoneNumberAccountStatus": "ACCOUNT_WITHOUT_PASSWORD",
            },
        }
        assert len(self.smsoutbox) == 1
        assert self.smsoutbox[0].to == "+15551234567"


def test_last_queried_phone_number_info_returns_none(graphql_client):
    assert graphql_client.execute(
        "query { session { lastQueriedPhoneNumber, lastQueriedPhoneNumberAccountStatus } }"
    ) == {
        "data": {
            "session": {
                "lastQueriedPhoneNumber": None,
                "lastQueriedPhoneNumberAccountStatus": None,
            }
        }
    }
