import logging
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from twilio.rest import Client


logger = logging.getLogger(__name__)


def _ensure_setting_is_nonempty(setting: str):
    if not getattr(settings, setting):
        raise ImproperlyConfigured(
            f"TWILIO_ACCOUNT_SID is non-empty, but "
            f"{setting} is empty!"
        )


def validate_settings():
    if not settings.TWILIO_ACCOUNT_SID:
        return
    for setting in ['TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']:
        _ensure_setting_is_nonempty(setting)


def send_sms(phone_number: str, body: str):
    if settings.TWILIO_ACCOUNT_SID:
        client = Client(settings.TWILIO_ACCOUNT_SID,
                        settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            to=f"+1{phone_number}",
            from_=f"+1{settings.TWILIO_PHONE_NUMBER}",
            body=body
        )
    else:
        logging.info(
            f'SMS sending is disabled. If it were enabled, '
            f'{phone_number} would receive a text message '
            f'with the body {repr(body)}.'
        )
