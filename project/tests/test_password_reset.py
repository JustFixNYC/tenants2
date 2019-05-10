import time
import pytest

from users.tests.factories import UserFactory
import project.password_reset as pr


VCODE = '123456'


class BaseTest:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, http_request):
        self.req = http_request


class TestCreateVerificationCode(BaseTest):
    def create(self, phone_number='5551234567'):
        return pr.create_verification_code(self.req, phone_number)

    def test_it_does_nothing_on_invalid_phone_number(self, db):
        UserFactory(phone_number='5559991111')
        self.create()
        assert pr.TIMESTAMP_SESSION_KEY not in self.req.session
        assert pr.USER_ID_SESSION_KEY not in self.req.session
        assert pr.VCODE_SESSION_KEY not in self.req.session

    def test_it_sets_session_info_on_valid_phone_number(self, db):
        user = UserFactory(phone_number='5551234567')
        now = time.time()
        self.create()
        assert self.req.session[pr.TIMESTAMP_SESSION_KEY] >= now
        assert self.req.session[pr.USER_ID_SESSION_KEY] == user.pk
        assert len(self.req.session[pr.VCODE_SESSION_KEY]) == 6


class TestVerifyVerificationCode(BaseTest):
    def configure_session(self, timestamp):
        self.req.session[pr.VCODE_SESSION_KEY] = VCODE
        self.req.session[pr.TIMESTAMP_SESSION_KEY] = timestamp

    def verify(self, code=VCODE):
        return pr.verify_verification_code(self.req, code)

    def test_it_errors_on_empty_session(self):
        assert 'Incorrect verification code' in self.verify()
        assert pr.VERIFIED_TIMESTAMP_SESSION_KEY not in self.req.session

    def test_it_errors_on_invalid_code(self):
        self.configure_session(time.time())
        assert 'Incorrect verification code' in self.verify('111111')
        assert pr.VERIFIED_TIMESTAMP_SESSION_KEY not in self.req.session

    def test_it_errors_when_code_expired(self):
        self.configure_session(0.0)
        assert "Verification code expired" in self.verify()
        assert pr.VERIFIED_TIMESTAMP_SESSION_KEY not in self.req.session

    def test_it_works_when_code_is_valid(self):
        now = time.time()
        self.configure_session(now)
        assert self.verify() is None
        assert self.req.session[pr.VERIFIED_TIMESTAMP_SESSION_KEY] >= now


class TestSetPassword(BaseTest):
    def configure_session(self, timestamp, user_id=1):
        self.req.session[pr.USER_ID_SESSION_KEY] = user_id
        self.req.session[pr.VERIFIED_TIMESTAMP_SESSION_KEY] = timestamp

    def set_pw(self, pw='my_new_pw'):
        return pr.set_password(self.req, pw)

    def test_it_errors_on_empty_session(self):
        assert 'Please go back' in self.set_pw()

    def test_it_errors_when_time_expired(self):
        self.configure_session(timestamp=0)
        assert 'Please go back' in self.set_pw()

    def test_it_works(self, db):
        user = UserFactory()
        now = time.time()
        self.configure_session(timestamp=now, user_id=user.pk)
        assert self.set_pw('my_awesome_new_pw') is None
        user.refresh_from_db()
        assert user.check_password('my_awesome_new_pw') is True
