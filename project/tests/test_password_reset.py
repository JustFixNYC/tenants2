import time
import pytest

import project.password_reset as pr


VCODE = '123456'


class TestVerifyVerificationCode:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, http_request):
        self.req = http_request

    def configure_session(self, timestamp):
        self.req.session[pr.VCODE_SESSION_KEY] = VCODE
        self.req.session[pr.TIMESTAMP_SESSION_KEY] = timestamp

    def verify(self, code=VCODE):
        return pr.verify_verification_code(self.req, code)

    def test_it_errors_on_empty_session(self):
        assert 'Please go back' in self.verify()
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
