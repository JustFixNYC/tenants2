import pytest

from .factories import UserFactory, LegacyUserInfoFactory
from ..models import LegacyUserInfo


@pytest.mark.django_db
def test_legacy_user_is_valid():
    legacy = LegacyUserInfoFactory()
    legacy.full_clean()


@pytest.mark.django_db
def test_is_legacy_user_returns_false():
    user = UserFactory()
    assert LegacyUserInfo.is_legacy_user(user) is False


@pytest.mark.django_db
def test_is_legacy_user_returns_true():
    user = UserFactory()
    LegacyUserInfoFactory(user=user)
    assert LegacyUserInfo.is_legacy_user(user) is True
