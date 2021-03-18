from project.util.testing_util import one_field_err
from django.urls import reverse
from django.contrib import auth
import pytest

from onboarding.tests.factories import OnboardingInfoFactory
from users import impersonation


IMPERSONATED_BY_QUERY = "query { session { impersonatedBy } }"

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
    def setup_fixture(self, db, admin_client, disable_locale_middleware, settings, graphql_client):
        # Seems like we need this to get the actual Http404 reasons.
        settings.DEBUG = True

        self.client = admin_client
        self.graphql_client = graphql_client

    def exec_graphql(self, query: str):
        self.graphql_client.request.session = self.client.session
        return self.graphql_client.execute(query)

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
        assert b"You are about to start impersonating" in res.content
        assert self.get_imp_user() is None

    def test_impersonated_by_is_none_if_not_impersonating(self):
        res = self.exec_graphql(IMPERSONATED_BY_QUERY)
        assert res["data"]["session"]["impersonatedBy"] is None

    def test_unimpersonate_raises_error_if_not_impersonating(self):
        res = self.exec_graphql(UNIMPERSONATE_QUERY)
        assert res["data"]["unimpersonate"] == {
            "errors": one_field_err("You are not currently impersonating another user."),
            "session": None,
        }

    def test_impersonation_and_unimpersonation_work(self):
        oi = OnboardingInfoFactory()
        res = self.client.post(get_impersonate_url(oi.user.pk))
        assert res.status_code == 302
        assert res["Location"] == "/"
        user = auth.get_user(self.client)
        assert user.id == oi.user.pk
        imp_user = self.get_imp_user()
        assert imp_user.id != oi.user.pk
        assert imp_user.is_superuser is True

        res = self.exec_graphql(IMPERSONATED_BY_QUERY)
        assert res["data"]["session"]["impersonatedBy"] == "admin"

        res = self.exec_graphql(UNIMPERSONATE_QUERY)
        assert res["data"]["unimpersonate"] == {"errors": [], "session": {"impersonatedBy": None}}

        assert self.get_imp_user() is None
        assert auth.get_user(self.graphql_client.request).pk == imp_user.pk
