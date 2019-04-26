from pathlib import Path
from io import StringIO
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.core.management.base import CommandError
import pytest

from project.management.commands import sendtestslack


def test_envhelp_works():
    out = StringIO()
    call_command('envhelp', stdout=out)
    assert 'DEBUG' in out.getvalue()


def test_fixnewlines_works():
    testfile = Path('test-file-with-crlfs.txt').resolve()
    testfile.write_bytes(b'hello there.\r\nhow are you.')
    try:
        out = StringIO()
        call_command('fixnewlines', str(testfile), stdout=out)
        assert 'Converting 1 CRLFs to LFs' in out.getvalue()
        assert testfile.read_bytes() == b'hello there.\nhow are you.'
    finally:
        testfile.unlink()


def test_raisetesterror_works():
    with pytest.raises(Exception, match="exception with id 'boop'"):
        call_command('raisetesterror', 'boop')


class SendtestslackTests(TestCase):
    @override_settings(SLACK_WEBHOOK_URL='')
    def test_it_raises_error_when_settings_are_not_defined(self):
        with self.assertRaises(CommandError) as cm:
            call_command('sendtestslack')
        self.assertIn('SLACK_WEBHOOK_URL must be configured.',
                      cm.exception.args[0])

    @override_settings(SLACK_WEBHOOK_URL='http://boop')
    @patch.object(sendtestslack, 'sendmsg')
    def test_it_has_exit_code_zero_when_sendmsg_is_successful(self, m):
        m.return_value = True
        call_command('sendtestslack')
        m.assert_called_with(
            'Hi, this is a test message sent from <https://example.com/|example.com>!',
            is_safe=True)

    @override_settings(SLACK_WEBHOOK_URL='http://boop')
    @patch.object(sendtestslack, 'sendmsg')
    def test_it_raises_error_when_sendmsg_fails(self, m):
        m.return_value = False
        with self.assertRaises(CommandError) as cm:
            call_command('sendtestslack')
        self.assertIn('Sending test Slack message failed.',
                      cm.exception.args[0])


class TestStoreTestFile:
    def test_it_deletes_file_by_default(self, django_file_storage):
        out = StringIO()
        call_command('storetestfile', stdout=out)
        assert 'Deleting test file' in out.getvalue()

    def test_it_does_not_delete_file_if_told_not_to(self, django_file_storage):
        out = StringIO()
        call_command('storetestfile', '--no-delete', stdout=out)
        assert 'Please delete "storetestfile_test_file.txt" manually' in out.getvalue()


class TestUserStats:
    def test_it_works(self, db):
        from onboarding.tests.factories import OnboardingInfoFactory
        from rapidpro.tests.factories import UserContactGroupFactory

        redacted = 'REDACTED'
        pad_bbl = '1234567890'
        oi = OnboardingInfoFactory(pad_bbl=pad_bbl)
        UserContactGroupFactory(user=oi.user, group__uuid='1', group__name='Boop')
        UserContactGroupFactory(user=oi.user, group__uuid='2', group__name='Goop')

        out = StringIO()
        call_command('userstats', stdout=out)
        assert pad_bbl not in out.getvalue()
        assert redacted in out.getvalue()
        assert '"Boop, Goop"' in out.getvalue()

        out = StringIO()
        call_command('userstats', '--include-pad-bbl', stdout=out)
        assert pad_bbl in out.getvalue()
        assert redacted not in out.getvalue()
