from unittest.mock import MagicMock
import pytest
from django.core.management import call_command, CommandError

from mailchimp.management.commands import mailchimp_subscribe
from mailchimp.mailchimp import Language, SubscribeSource


class TestMailchimpSubscribe:
    def test_it_raises_err_when_mailchimp_is_disabled(self):
        with pytest.raises(CommandError, match="Mailchimp integration is disabled"):
            call_command("mailchimp_subscribe", "boop@jones.com", "en", "orgsite")

    def test_it_works(self, mailchimp, settings, monkeypatch):
        mock = MagicMock()
        monkeypatch.setattr(mailchimp_subscribe.mailchimp, "subscribe", mock)
        call_command("mailchimp_subscribe", "boop@jones.com", "en", "orgsite")
        mock.assert_called_once_with(
            email="boop@jones.com",
            language=Language.English,
            source=SubscribeSource.OrgSite,
        )
