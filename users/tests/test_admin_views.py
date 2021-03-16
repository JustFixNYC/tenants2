from django.urls import reverse
from django.contrib import auth
import pytest

from onboarding.tests.factories import OnboardingInfoFactory
from users import impersonation


UNIMPERSONATE_QUERY = """
mutation {
  unimpersonate(input: {}) {
    errors {
      field,
      messages
    }
    session {
      impersonatedBy
    }
  }
}
"""


def get_impersonate_url(userid):
    return reverse("admin:impersonate-user", kwargs={"user_id": userid})


class TestImpersonateUserPermission:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, client):
        self.client = client

    def ensure_access_is_denied(self):
        res = self.client.get(get_impersonate_url(1))
        assert res.status_code == 302
        assert res["Location"].startswith("/admin/login/")

    def test_it_denies_anonymous_users(self):
        self.ensure_access_is_denied()

    def test_it_denies_non_staff_users(self, db):
        user = OnboardingInfoFactory().user
        self.client.force_login(user)
        self.ensure_access_is_denied()


class TestImpersonateUser:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db, admin_client, disable_locale_middleware, settings):
        # Seems like we need this to get the actual Http404 reasons.
        settings.DEBUG = True

        self.client = admin_client

    def get_imp_user(self):
        return impersonation.get_impersonating_user(self.client)

    def test_it_raises_404_if_user_does_not_exist(self):
        res = self.client.get(get_impersonate_url(51929))
        assert res.status_code == 404
        assert self.get_imp_user() is None

    def test_get_works_if_user_exists(self):
        oi = OnboardingInfoFactory()
        res = self.client.get(get_impersonate_url(oi.user.pk))
        assert res.status_code == 200
        assert self.get_imp_user() is None

    def test_impersonation_and_unimpersonation_work(self, graphql_client):
        oi = OnboardingInfoFactory()
        res = self.client.post(get_impersonate_url(oi.user.pk))
        assert res.status_code == 302
        assert res["Location"] == "/"
        user = auth.get_user(self.client)
        assert user.id == oi.user.pk
        imp_user = self.get_imp_user()
        assert imp_user.id != oi.user.pk
        assert imp_user.is_superuser is True

        graphql_client.request.session = self.client.session

        res = graphql_client.execute("query { session { impersonatedBy } }")
        assert res["data"]["session"]["impersonatedBy"] == "admin"

        res = graphql_client.execute(UNIMPERSONATE_QUERY)
        assert res["data"]["unimpersonate"] == {"errors": [], "session": {"impersonatedBy": None}}

        assert self.get_imp_user() is None
        assert auth.get_user(graphql_client.request).pk == imp_user.pk
