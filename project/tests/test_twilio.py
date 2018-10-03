import pytest
from django.core.exceptions import ImproperlyConfigured

from project.twilio import send_sms, validate_settings


def test_send_sms_works(settings, smsoutbox):
    settings.TWILIO_PHONE_NUMBER = '9990001234'

    send_sms('5551234567', 'boop')
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == '+15551234567'
    assert smsoutbox[0].from_ == '+19990001234'
    assert smsoutbox[0].body == 'boop'


def test_sms_does_not_send_sms_if_sms_is_disabled(settings, smsoutbox):
    settings.TWILIO_ACCOUNT_SID = ''
    send_sms('5551234567', 'boop')
    assert len(smsoutbox) == 0


class TestValidateSettings:
    def test_no_account_sid_is_valid(self, settings):
        settings.TWILIO_ACCOUNT_SID = ''
        validate_settings()

    def test_all_settings_is_valid(self, settings):
        settings.TWILIO_ACCOUNT_SID = 'test account sid'
        settings.TWILIO_AUTH_TOKEN = 'test auth token'
        settings.TWILIO_PHONE_NUMBER = '0001234567'
        validate_settings()

    def test_partial_config_is_invalid(self, settings):
        settings.TWILIO_ACCOUNT_SID = 'test account sid'
        settings.TWILIO_AUTH_TOKEN = ''
        settings.TWILIO_PHONE_NUMBER = ''

        with pytest.raises(
            ImproperlyConfigured,
            match="TWILIO_ACCOUNT_SID is non-empty, but"
        ):
            validate_settings()
