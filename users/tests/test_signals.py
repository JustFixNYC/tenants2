from functools import wraps
from unittest.mock import patch
from django.contrib.auth.models import Permission
from django.test import TestCase

from .factories import UserFactory


class MockLogger():
    def __init__(self):
        self.logs = []

    def info(self, fmt, *args):
        self.logs.append(fmt % args)


def mock_logged(fn):
    @wraps(fn)
    @patch('users.signals.logger', MockLogger())
    def wrapper(self):
        import users.signals
        return fn(self, users.signals.logger)

    return wrapper


class M2MTests(TestCase):
    def setUp(self):
        self.user = UserFactory()

    @mock_logged
    def test_change_is_logged(self, logger):
        perm = Permission.objects.get(codename='change_justfixuser')
        self.user.user_permissions.add(perm)
        self.assertEqual(logger.logs, [
            "permissions given to user '5551234567 (Boop Jones)': "
            "[<Permission: users | user | Can change user>]"
        ])

    @mock_logged
    def test_remove_is_logged(self, logger):
        perm = Permission.objects.get(codename='change_justfixuser')
        self.user.user_permissions.add(perm)
        self.user.user_permissions.remove(perm)
        self.assertIn((
            "permissions removed from user '5551234567 (Boop Jones)': "
            "[<Permission: users | user | Can change user>]"
        ), logger.logs)

    @mock_logged
    def test_clear_is_logged(self, logger):
        perm = Permission.objects.get(codename='change_justfixuser')
        self.user.user_permissions.add(perm)
        self.user.user_permissions.clear()
        self.assertIn((
            "All permissions removed from user '5551234567 (Boop Jones)'"
        ), logger.logs)
