from django.contrib.auth.models import User
import pytest

from ..models import (
    LegacyUserInfo
)


@pytest.mark.django_db
def test_is_legacy_user_returns_false():
    user = User.objects.create_user('boop')
    assert LegacyUserInfo.is_legacy_user(user) is False


@pytest.mark.django_db
def test_is_legacy_user_returns_true():
    user = User.objects.create_user('boop')
    legacy = LegacyUserInfo(
        user=user,
        role=LegacyUserInfo.TENANT,
        mongo_id='blargy',
        phone_number="1234567890"
    )
    legacy.full_clean()
    legacy.save()
    assert LegacyUserInfo.is_legacy_user(user) is True
