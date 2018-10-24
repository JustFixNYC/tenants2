import pytest
from unittest.mock import patch
from django.contrib.auth.models import Permission
from django.contrib.admin.models import (
    ContentType, LogEntry, ADDITION, CHANGE, DELETION
)

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


def create_log_entry(**kwargs):
    user = UserFactory()
    ctype = ContentType.objects.get(app_label='users', model='justfixuser')
    LogEntry(user=user, object_repr='blargy', content_type=ctype, **kwargs).save()


@pytest.mark.django_db
def test_logentry_addition_is_logged():
    with patch('users.signals.logger') as mock:
        create_log_entry(action_flag=ADDITION)
        mock.info.assert_called_once_with("boop created user 'blargy'")


@pytest.mark.django_db
def test_logentry_deletion_is_logged():
    with patch('users.signals.logger') as mock:
        create_log_entry(action_flag=DELETION)
        mock.info.assert_called_once_with("boop deleted user 'blargy'")


@pytest.mark.django_db
def test_logentry_change_is_logged():
    with patch('users.signals.logger') as mock:
        create_log_entry(action_flag=CHANGE, change_message='oof')
        mock.info.assert_called_once_with("boop changed user 'blargy': oof")
