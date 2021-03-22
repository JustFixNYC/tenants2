import freezegun
import pytest

from users.tests.factories import UserFactory
from .factories import TwofactorInfoFactory


SECRET_SENTINEL = "otpauth://totp/"
SCRIPT_SENTINEL = "</script>"
ERROR_SENTINEL = "Alas"


def test_verify_redirects_anonymous_users_to_login(client):
    res = client.get("/verify")
    assert res.status_code == 302
    assert res["location"] == "/login?next=/verify"


class TestAuthenticatedVerify:
    @pytest.fixture(autouse=True)
    def authenticated_client(self, db, django_app):
        self.user = UserFactory()
        self.app = django_app
        django_app.set_user(self.user)
        with freezegun.freeze_time("2018-01-01"):
            yield

    def test_it_shows_secret_on_first_visit(self):
        res = self.app.get("/verify?next=/blarg")
        assert res.status_int == 200
        assert SECRET_SENTINEL in res
        assert SCRIPT_SENTINEL in res

    def test_it_hides_secret_on_subsequent_visits(self):
        TwofactorInfoFactory(user=self.user, has_user_seen_secret_yet=True)
        res = self.app.get("/verify?next=/blarg")
        assert res.status_int == 200
        assert SECRET_SENTINEL not in res
        assert SCRIPT_SENTINEL not in res

    def test_it_redirects_user_when_otp_is_correct(self):
        res = self.app.get("/verify?next=/blarg")
        res.form["otp"] = self.user.twofactor_info.totp.now()
        res = res.form.submit()
        assert res.status_int == 302
        assert res.location == "/blarg"

    def test_it_shows_error_when_otp_is_incorrect(self):
        res = self.app.get("/verify")
        assert ERROR_SENTINEL not in res

        res.form["otp"] = "123456"
        res = res.form.submit()

        assert res.status_int == 200
        assert ERROR_SENTINEL in res

    def test_it_redirects_already_verified_users_to_success(self):
        res = self.app.get("/verify")
        res.form["otp"] = self.user.twofactor_info.totp.now()
        res.form.submit()

        res = self.app.get("/verify")

        assert res.status_int == 302
        assert res.location == "/"
