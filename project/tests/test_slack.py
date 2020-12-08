from unittest.mock import patch
from django.test import TestCase, override_settings
from django.conf import settings

from .. import slack


@override_settings(SLACK_WEBHOOK_URL="http://boop")
def test_sendmsg_returns_false_when_post_to_webhook_fails(requests_mock):
    requests_mock.post(settings.SLACK_WEBHOOK_URL, status_code=500)
    assert slack.sendmsg("hi") is False


@override_settings(SLACK_WEBHOOK_URL="http://boop")
def test_sendmsg_returns_true_on_success(requests_mock):
    requests_mock.post(settings.SLACK_WEBHOOK_URL, status_code=200)
    assert slack.sendmsg("hi") is True


class TestSendMsgPayload:
    def test_text_is_escaped_by_default(self):
        with patch.object(slack, "send_payload") as m:
            slack.sendmsg("bop < <")
        m.assert_called_with({"text": "bop &lt; &lt;"})

    def test_text_is_unescaped_if_specified(self):
        with patch.object(slack, "send_payload") as m:
            slack.sendmsg("bop < <", is_safe=True)
        m.assert_called_with({"text": "bop < <"})


class SlackTests(TestCase):
    @override_settings(SLACK_WEBHOOK_URL="")
    @patch.object(slack.logger, "debug")
    def test_sendmsg_returns_false_when_settings_are_not_defined(self, m):
        self.assertFalse(slack.sendmsg("hi"))
        m.assert_called_with("SLACK_WEBHOOK_URL is empty; not sending message.")
