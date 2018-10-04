import logging
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from twilio.rest import Client
from twilio.http.http_client import TwilioHttpClient


logger = logging.getLogger(__name__)


def _ensure_setting_is_nonempty(setting: str):
    '''
    Make sure the Django setting with the given name is truthy.
    '''

    if not getattr(settings, setting):
        raise ImproperlyConfigured(
            f"TWILIO_ACCOUNT_SID is non-empty, but "
            f"{setting} is empty!"
        )


def validate_settings():
    '''
    Ensure that the Twilio-related settings are defined properly.
    '''

    if not settings.TWILIO_ACCOUNT_SID:
        # Twilio integration is disabled, no need to check anything else.
        return
    for setting in ['TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']:
        _ensure_setting_is_nonempty(setting)


class JustfixHttpClient(TwilioHttpClient):
    '''
    Just like the standard Twilio HTTP client, but with a default timeout
    to ensure that our server doesn't hang if Twilio becomes unresponsive.
    '''

    def request(self, *args, **kwargs):
        timeout = kwargs.get('timeout')
        if timeout is None:
            kwargs['timeout'] = settings.TWILIO_TIMEOUT
        return super().request(*args, **kwargs)


def send_sms(phone_number: str, body: str, fail_silently=False):
    '''
    Send an SMS message to the given phone number, with the given body.

    If `fail_silently` is True, any exceptions raised will be logged,
    but not propagated.
    '''

    if settings.TWILIO_ACCOUNT_SID:
        client = Client(settings.TWILIO_ACCOUNT_SID,
                        settings.TWILIO_AUTH_TOKEN,
                        http_client=JustfixHttpClient())
        try:
            client.messages.create(
                to=f"+1{phone_number}",
                from_=f"+1{settings.TWILIO_PHONE_NUMBER}",
                body=body
            )
        except Exception:
            if fail_silently:
                logger.exception(f'Error while communicating with Twilio')
            else:
                raise
    else:
        logger.info(
            f'SMS sending is disabled. If it were enabled, '
            f'{phone_number} would receive a text message '
            f'with the body {repr(body)}.'
        )
