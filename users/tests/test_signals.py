import pytest
from unittest.mock import patch
from django.contrib.auth.models import Permission

from .factories import UserFactory


def create_user_with_perm():
    perm = Permission.objects.get(codename='change_justfixuser')
    user = UserFactory()
    user.user_permissions.add(perm)
    return user, perm


@pytest.mark.django_db
def test_permission_change_is_logged():
    with patch('users.signals.logger') as mock:
        create_user_with_perm()
        mock.info.assert_called_once_with(
            "permissions given to user '5551234567 (Boop Jones)': "
            "[<Permission: users | user | Can change user>]"
        )


@pytest.mark.django_db
def test_permission_remove_is_logged():
    user, perm = create_user_with_perm()
    with patch('users.signals.logger') as mock:
        user.user_permissions.remove(perm)
        mock.info.assert_called_once_with(
            "permissions removed from user '5551234567 (Boop Jones)': "
            "[<Permission: users | user | Can change user>]"
        )


@pytest.mark.django_db
def test_permission_clear_is_logged():
    user, _ = create_user_with_perm()
    with patch('users.signals.logger') as mock:
        user.user_permissions.clear()
        mock.info.assert_called_once_with(
            "All permissions removed from user '5551234567 (Boop Jones)'"
        )
