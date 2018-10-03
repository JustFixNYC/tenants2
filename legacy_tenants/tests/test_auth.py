from unittest.mock import patch
import pytest

from users.models import JustfixUser
from users.tests.factories import UserFactory
from .. import auth, mongo
from . import factories
from .example_legacy_data import (
    SALT,
    SALT_BYTES,
    PASSWORD_HASH,
    PASSWORD
)


def test_validate_password_returns_true():
    assert auth.validate_password(PASSWORD, PASSWORD_HASH, SALT) is True


def test_validate_password_returns_false():
    assert auth.validate_password('not password', PASSWORD_HASH, SALT) is False


def test_convert_salt_to_bytes_returns_ascii_encoding():
    assert auth.convert_salt_to_bytes('blarg') == b'blarg'


def test_convert_salt_to_bytes_does_weird_conversion_thing():
    assert auth.convert_salt_to_bytes(SALT) == SALT_BYTES


def test_backend_returns_none_if_phone_number_or_pwd_are_none(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    assert backend.authenticate(None, None, None) is None
    assert backend.authenticate(None, 'boop', None) is None
    assert backend.authenticate(None, None, 'boop') is None


def test_backend_returns_none_if_db_url_is_falsy(settings):
    settings.LEGACY_MONGODB_URL = ''
    assert auth.LegacyTenantsAppBackend().authenticate(None, 'blah', 'barg') is None


@pytest.mark.django_db
def test_backend_creates_tenant_user_if_they_do_not_exist(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(mongo, 'get_user_by_phone_number') as get_user:
        get_user.return_value = factories.MongoUserFactory(is_advocate=False)
        user = backend.authenticate(None, '1234567890', 'password')
        get_user.assert_called_with('1234567890')
        assert isinstance(user, JustfixUser)
        assert user.username == 'legacy_1234567890'
        assert user.legacy_info.role == 'TENANT'
        assert user.first_name == 'Testy'
        assert user.last_name == 'Test'


@pytest.mark.django_db
def test_backend_creates_advocate_user_if_they_do_not_exist(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(mongo, 'get_user_by_phone_number') as get_user:
        get_user.return_value = factories.MongoUserFactory(is_advocate=True)
        user = backend.authenticate(None, '1234567890', 'password')
        assert user.legacy_info.role == 'ADVOCATE'
        assert user.first_name == 'Boop'
        assert user.last_name == 'Jones'


def test_backend_returns_false_if_password_is_wrong(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(mongo, 'get_user_by_phone_number') as get_user:
        get_user.return_value = factories.MongoUserFactory()
        assert backend.authenticate(None, '1234567890', 'test') is None


@pytest.mark.django_db
def test_backend_returns_existing_user(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(mongo, 'get_user_by_phone_number') as get_user:
        mongo_user = factories.MongoUserFactory()
        get_user.return_value = mongo_user
        user = backend.authenticate(None, mongo_user.identity.phone, 'password')
        auth_user = backend.authenticate(None, mongo_user.identity.phone, 'password')
        assert isinstance(auth_user, JustfixUser)
        assert user.pk == auth_user.pk


@pytest.mark.django_db
def test_get_user_returns_none_for_nonexistent_user():
    backend = auth.LegacyTenantsAppBackend()
    assert backend.get_user(999) is None


@pytest.mark.django_db
def test_get_user_returns_user_if_they_exist():
    backend = auth.LegacyTenantsAppBackend()
    user = UserFactory()
    assert backend.get_user(user.pk) == user
