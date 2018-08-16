from io import StringIO
from unittest.mock import patch
from django.core.management import call_command


def get_cmd_output(*args):
    io = StringIO()
    call_command(*args, stdout=io)
    return io.getvalue()


def test_try_legacy_password_reports_when_correct():
    with patch('legacy_tenants.auth.try_password', return_value=True):
        assert get_cmd_output('try_legacy_password', '1234567890', 'pwd') == \
            'Password is correct!\n'


def test_try_legacy_password_reports_when_incorrect():
    with patch('legacy_tenants.auth.try_password', return_value=False):
        assert get_cmd_output('try_legacy_password', '1234567890', 'pwd') == \
            'Invalid password!\n'
