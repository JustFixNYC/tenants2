import pytest
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.conf import settings

from .. import slackbot


@pytest.mark.django_db
@override_settings(SLACKBOT_WEBHOOK_URL='http://boop')
def test_sendmsg_returns_false_when_post_to_webhook_fails(requests_mock):
    requests_mock.post(settings.SLACKBOT_WEBHOOK_URL, status_code=500)
    assert slackbot.sendmsg('hi') is False


@pytest.mark.django_db
@override_settings(SLACKBOT_WEBHOOK_URL='http://boop')
def test_sendmsg_returns_true_on_success(requests_mock):
    requests_mock.post(settings.SLACKBOT_WEBHOOK_URL, status_code=200)
    assert slackbot.sendmsg('hi') is True


class BotTests(TestCase):
    @override_settings(SLACKBOT_WEBHOOK_URL='')
    @patch.object(slackbot.logger, 'debug')
    def test_sendmsg_returns_false_when_settings_are_not_defined(self, m):
        self.assertFalse(slackbot.sendmsg('hi'))
        m.assert_called_with(
            'SLACKBOT_WEBHOOK_URL is empty; not sending message.')
