import pytest

from users.tests.factories import UserFactory
from project.util import schema_json
from .util import get_frontend_queries


@pytest.mark.django_db
def test_login_works(graphql_client):
    user = UserFactory(phone_number='5551234567', password='blarg')
    result = graphql_client.execute(
        get_frontend_queries(
            'LoginMutation.graphql',
            'AllSessionInfo.graphql',
            'ExtendedFormFieldErrors.graphql'
        ),
        variables={
            'input': {
                'phoneNumber': '5551234567',
                'password': 'blarg'
            }
        }
    )

    login = result['data']['output']
    assert login['errors'] == []
    assert len(login['session']['csrfToken']) > 0
    assert graphql_client.request.user.pk == user.pk


@pytest.mark.django_db
def test_logout_works(graphql_client):
    user = UserFactory()
    graphql_client.request.user = user
    logout_mutation = get_frontend_queries(
        'LogoutMutation.graphql',
        'AllSessionInfo.graphql',
        'ExtendedFormFieldErrors.graphql'
    )
    result = graphql_client.execute(logout_mutation, variables={'input': {}})
    assert len(result['data']['output']['session']['csrfToken']) > 0
    assert graphql_client.request.user.pk is None


class TestPasswordReset:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, smsoutbox, db, monkeypatch):
        self.graphql_client = graphql_client
        self.smsoutbox = smsoutbox
        monkeypatch.setattr(
            'project.password_reset.get_random_string',
            self._fake_get_random_string
        )

    def _fake_get_random_string(self, length, allowed_chars):
        assert length == 6
        assert allowed_chars == '0123456789'
        return '123456'

    def mutate_password_reset_confirm(
        self,
        password='my_new_pw1234',
        confirm_password='my_new_pw1234'
    ):
        result = self.graphql_client.execute(
            '''
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
            ''' % (password, confirm_password)
        )
        return result['data']['passwordResetConfirm']['errors']

    def mutate_password_reset_verification_code(self):
        result = self.graphql_client.execute(
            '''
            mutation {
                passwordResetVerificationCode(input: {code: "123456"}) {
                    errors {
                        field,
                        messages
                    }
                }
            }
            '''
        )
        return result['data']['passwordResetVerificationCode']['errors']

    def mutate_password_reset(self):
        result = self.graphql_client.execute(
            '''
            mutation {
                passwordReset(input: {phoneNumber: "5551234567"}) {
                    errors {
                        field,
                        messages
                    }
                }
            }
            '''
        )
        return result['data']['passwordReset']['errors']

    def test_it_does_nothing_on_bad_phone_number(self):
        assert self.mutate_password_reset() == []
        assert len(self.smsoutbox) == 0

    def test_it_sends_sms_on_success(self):
        UserFactory(phone_number='5551234567')
        assert self.mutate_password_reset() == []
        assert len(self.smsoutbox) == 1
        msg = self.smsoutbox[0]
        assert msg.to == '+15551234567'
        assert 'Your verification code is 123456' in msg.body

    def test_entire_reset_process_works(self):
        user = UserFactory(phone_number='5551234567')
        assert self.mutate_password_reset() == []
        assert self.mutate_password_reset_verification_code() == []
        assert self.mutate_password_reset_confirm() == []
        user.refresh_from_db()
        assert user.check_password('my_new_pw1234') is True

    def test_password_field_is_required(self):
        assert 'This field is required' in repr(self.mutate_password_reset_confirm('', ''))

    def test_confirm_raises_errors(self):
        assert 'Please go back' in repr(self.mutate_password_reset_confirm())

    def test_verification_raises_errors(self):
        assert 'Incorrect verification' in repr(self.mutate_password_reset_verification_code())


def test_schema_json_is_up_to_date():
    err_msg = (
        f'{schema_json.FILENAME} is out of date! '
        f'Please run "{schema_json.REBUILD_CMDLINE}" to rebuild it.'
    )

    if not schema_json.is_up_to_date():
        raise Exception(err_msg)


def test_is_staff_works(graphql_client):
    def get_is_staff():
        result = graphql_client.execute('query { session { isStaff } }')
        return result['data']['session']['isStaff']

    assert get_is_staff() is False, "anonymous user is not staff"

    graphql_client.request.user = UserFactory.build(is_staff=False)
    assert get_is_staff() is False

    graphql_client.request.user = UserFactory.build(is_staff=True)
    assert get_is_staff() is True


def test_first_and_last_name_works(graphql_client):
    def get():
        result = graphql_client.execute('query { session { firstName, lastName } }')
        sess = result['data']['session']
        return (sess['firstName'], sess['lastName'])

    assert get() == (None, None), "anonymous user has no first/last name"

    graphql_client.request.user = UserFactory.build(full_name="Boop Jones")
    assert get() == ("Boop", "Jones")


def test_user_id_works(graphql_client, db):
    def get():
        result = graphql_client.execute('query { session { userId } }')
        return result['data']['session']['userId']

    assert get() is None, "anonymous user has no user ID"

    user = UserFactory()
    assert user.pk is not None
    graphql_client.request.user = user
    assert get() == user.pk
