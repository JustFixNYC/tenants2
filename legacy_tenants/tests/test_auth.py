from unittest.mock import patch
from django.contrib.auth.models import User
import pytest

from .. import auth
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


def test_backend_returns_none_if_username_or_pwd_are_none(settings):
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
    with patch.object(auth, 'try_password', return_value=True) as try_password:
        user = backend.authenticate(None, '1234567890', 'test')
        try_password.assert_called_with('1234567890', 'test')
        assert isinstance(user, User)
        assert user.username == '1234567890'


def test_backend_returns_false_if_try_password_fails(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(auth, 'try_password', return_value=False) as try_password:
        assert backend.authenticate(None, '1234567890', 'test') is None
        try_password.assert_called_with('1234567890', 'test')


@pytest.mark.django_db
def test_backend_returns_existing_user(settings):
    settings.LEGACY_MONGODB_URL = 'blah'
    user = User.objects.create_user('1234567890')
    backend = auth.LegacyTenantsAppBackend()
    with patch.object(auth, 'try_password', return_value=True) as try_password:
        auth_user = backend.authenticate(None, '1234567890', 'test')
        try_password.assert_called_with('1234567890', 'test')
        assert isinstance(auth_user, User)
        assert user.pk == auth_user.pk
