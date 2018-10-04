from unittest.mock import patch
import pytest
from django.core.exceptions import ImproperlyConfigured

from project.twilio import send_sms, validate_settings, logger


def test_send_sms_works(settings, smsoutbox):
    settings.TWILIO_PHONE_NUMBER = '9990001234'

    send_sms('5551234567', 'boop')
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == '+15551234567'
    assert smsoutbox[0].from_ == '+19990001234'
    assert smsoutbox[0].body == 'boop'


def apply_twilio_settings(settings):
    settings.TWILIO_ACCOUNT_SID = 'myaccount'
    settings.TWILIO_AUTH_TOKEN = 'test auth token'
    settings.TWILIO_PHONE_NUMBER = '0001234567'


def get_twilio_sms_url(settings):
    sid = settings.TWILIO_ACCOUNT_SID
    return f'https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json'


def test_send_sms_logs_errors_when_failing_silently(settings,  requests_mock):
    apply_twilio_settings(settings)
    requests_mock.post(get_twilio_sms_url(settings), json={})
    with patch.object(logger, 'exception') as mock_exc:
        send_sms('5551234567', 'boop', fail_silently=True)
    mock_exc.assert_called_once_with('Error while communicating with Twilio')


def test_send_sms_raises_exception_by_default(settings,  requests_mock):
    apply_twilio_settings(settings)
    requests_mock.post(get_twilio_sms_url(settings), json={})
    with pytest.raises(KeyError):
        send_sms('5551234567', 'boop')


def test_sms_does_not_send_sms_if_sms_is_disabled(settings, smsoutbox):
    settings.TWILIO_ACCOUNT_SID = ''
    send_sms('5551234567', 'boop')
    assert len(smsoutbox) == 0


class TestValidateSettings:
    def test_no_account_sid_is_valid(self, settings):
        settings.TWILIO_ACCOUNT_SID = ''
        validate_settings()

    def test_all_settings_is_valid(self, settings):
        apply_twilio_settings(settings)
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
