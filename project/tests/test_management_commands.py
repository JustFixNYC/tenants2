from io import StringIO
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.core.management import call_command
from django.core.management.base import CommandError

from project.management.commands import sendtestslack


def test_envhelp_works():
    out = StringIO()
    call_command('envhelp', stdout=out)
    assert 'DEBUG' in out.getvalue()


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
