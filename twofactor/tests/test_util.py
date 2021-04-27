import datetime
from freezegun import freeze_time
import pytest

from users.tests.factories import UserFactory
from twofactor import util


@pytest.fixture
def authreq(db, http_request):
    http_request.user = UserFactory()
    return http_request


class TestIsRequestUserVerified:
    def test_it_returns_false_if_user_is_not_authenticated(self, http_request):
        assert util.is_request_user_verified(http_request) is False

    def test_it_returns_true_if_twofactor_is_disabled(self, authreq, settings):
        settings.TWOFACTOR_VERIFY_DURATION = 0
        assert util.is_request_user_verified(authreq) is True

    def test_it_returns_false_if_user_is_not_verified(self, authreq):
        assert util.is_request_user_verified(authreq) is False

    def test_it_returns_true_if_user_is_verified(self, authreq):
        util.verify_request_user(authreq)
        assert util.is_request_user_verified(authreq) is True

    def test_it_returns_false_if_verification_expired(self, authreq, settings):
        with freeze_time("2018-01-01") as time:
            util.verify_request_user(authreq)
            assert util.is_request_user_verified(authreq) is True
            time.tick(delta=datetime.timedelta(seconds=settings.TWOFACTOR_VERIFY_DURATION + 1))
            assert util.is_request_user_verified(authreq) is False
