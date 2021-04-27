from django.contrib.auth.models import AnonymousUser
from django.contrib import auth

from .factories import UserFactory, SecondUserFactory
from users import impersonation
from users.models import IMPERSONATE_USERS_PERMISSION


class TestPreserveSessionKeys:
    def test_it_works(self, db, http_request, client):
        user = UserFactory()
        other = SecondUserFactory()

        auth.login(http_request, user)
        http_request.session["preserved"] = "hello"
        http_request.session["not_preserved"] = "bye"

        with impersonation.preserve_session_keys(http_request, ["preserved"]):
            auth.login(http_request, other)

        assert http_request.session["preserved"] == "hello"
        assert "not_preserved" not in http_request.session


class TestGetReasonForDenyingImpersonation:
    def test_it_returns_none_when_user_can_impersonate(self, db):
        user = UserFactory(is_staff=True, user_permissions=[IMPERSONATE_USERS_PERMISSION])
        other = SecondUserFactory()
        assert impersonation.get_reason_for_denying_impersonation(user, other) is None
        assert impersonation.can_user_impersonate(user, other) is True

    def test_it_returns_reason_when_user_is_anonymous(self, db):
        user = AnonymousUser()
        other = SecondUserFactory()
        assert (
            impersonation.get_reason_for_denying_impersonation(user, other)
            == impersonation.ImpersonationDenialReason.NOT_AUTHENTICATED
        )
        assert impersonation.can_user_impersonate(user, other) is False

    def test_it_returns_reason_when_user_is_not_staff(self, db):
        user = UserFactory()
        other = SecondUserFactory()
        assert (
            impersonation.get_reason_for_denying_impersonation(user, other)
            == impersonation.ImpersonationDenialReason.NOT_ACTIVE_STAFF_MEMBER
        )
        assert impersonation.can_user_impersonate(user, other) is False

    def test_it_returns_reason_when_user_is_not_active(self, db):
        user = UserFactory(is_staff=True, is_active=False)
        other = SecondUserFactory()
        assert (
            impersonation.get_reason_for_denying_impersonation(user, other)
            == impersonation.ImpersonationDenialReason.NOT_ACTIVE_STAFF_MEMBER
        )
        assert impersonation.can_user_impersonate(user, other) is False

    def test_it_returns_reason_when_user_lacks_impersonation_permission(self, db):
        user = UserFactory(is_staff=True)
        other = SecondUserFactory()
        assert (
            impersonation.get_reason_for_denying_impersonation(user, other)
            == impersonation.ImpersonationDenialReason.NEEDS_IMPERSONATE_USERS_PERMISSION
        )
        assert impersonation.can_user_impersonate(user, other) is False

    def test_it_returns_reason_when_user_is_not_superuser(self, db):
        user = UserFactory(is_staff=True, user_permissions=[IMPERSONATE_USERS_PERMISSION])
        other = SecondUserFactory(is_staff=True)
        assert (
            impersonation.get_reason_for_denying_impersonation(user, other)
            == impersonation.ImpersonationDenialReason.NOT_SUPERUSER
        )
        assert impersonation.can_user_impersonate(user, other) is False
