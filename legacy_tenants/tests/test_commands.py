from io import StringIO
from unittest.mock import patch
from django.core.management import call_command

from .example_legacy_data import TENANT


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


def test_validate_legacy_tenants_works(mock_mongodb):
    bad_tenant = {**TENANT, 'phone': None}
    fake_tenants = [TENANT, bad_tenant, bad_tenant]
    iterator = mock_mongodb['tenants'].find.return_value
    iterator.count.return_value = len(fake_tenants)
    iterator.__iter__.return_value = iter(fake_tenants)
    assert 'Out of 3 tenants, 2 are invalid' in get_cmd_output('validate_legacy_tenants')
