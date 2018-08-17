from unittest.mock import patch
from django.contrib.auth.models import User
import pytest

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
def test_backend_creates_user_if_they_do_not_exist(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(mongo, 'get_user_by_phone_number') as get_user:
        get_user.return_value = factories.MongoUserFactory()
        user = backend.authenticate(None, '1234567890', 'password')
        get_user.assert_called_with('1234567890')
        assert isinstance(user, User)
        assert user.username == 'legacy_1234567890'


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
        assert isinstance(auth_user, User)
        assert user.pk == auth_user.pk
