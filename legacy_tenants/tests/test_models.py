import pytest

from . import factories
from ..models import LegacyUserInfo


@pytest.mark.django_db
def test_legacy_user_is_valid():
    legacy = factories.LegacyUserInfoFactory()
    legacy.full_clean()


@pytest.mark.django_db
def test_is_legacy_user_returns_false():
    user = factories.UserFactory()
    assert LegacyUserInfo.is_legacy_user(user) is False


@pytest.mark.django_db
def test_is_legacy_user_returns_true():
    user = factories.UserFactory()
    factories.LegacyUserInfoFactory(user=user)
    assert LegacyUserInfo.is_legacy_user(user) is True


def test_update_from_mongo_user_works_for_tenants():
    legacy = factories.LegacyUserInfoFactory.build()
    mongo_user = factories.MongoUserFactory()
    legacy.update_from_mongo_user(mongo_user)
    assert legacy.role == 'TENANT'


def test_update_from_mongo_user_works_for_advocates():
    legacy = factories.LegacyUserInfoFactory.build()
    mongo_user = factories.MongoUserFactory(is_advocate=True)
    legacy.update_from_mongo_user(mongo_user)
    assert legacy.role == 'ADVOCATE'


def test_update_from_mongo_user_raises_when_invalid():
    legacy = factories.LegacyUserInfoFactory.build()
    with pytest.raises(ValueError, match='mongo user is neither tenant nor advocate'):
        mongo_user = factories.MongoUserFactory(tenant_info=None)
        legacy.update_from_mongo_user(mongo_user)
