import logging
from typing import Optional, Dict, Any
from django.conf import settings
from twilio.rest import Client
from twilio.http.http_client import TwilioHttpClient
from twilio.base.exceptions import TwilioRestException
from twilio.rest.lookups.v1.phone_number import PhoneNumberInstance

from project.util.settings_util import ensure_dependent_settings_are_nonempty

logger = logging.getLogger(__name__)


def validate_settings():
    '''
    Ensure that the Twilio-related settings are defined properly.
    '''

    ensure_dependent_settings_are_nonempty(
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'
    )


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


def get_client() -> Client:
    '''
    Return a Twilio client configured to use the Twilio API keys
    defined by the Django settings.
    '''

    return Client(settings.TWILIO_ACCOUNT_SID,
                  settings.TWILIO_AUTH_TOKEN,
                  http_client=JustfixHttpClient())


def send_sms(phone_number: str, body: str, fail_silently=False) -> str:
    '''
    Send an SMS message to the given phone number, with the given body.

    On success, the sid of the SMS message is returned. On failure
    (or if Twilio integration is disabled), an empty string is returned.

    If `fail_silently` is True, any exceptions raised will be logged,
    but not propagated.
    '''

    if settings.TWILIO_ACCOUNT_SID:
        client = get_client()
        try:
            msg = client.messages.create(
                to=f"+1{phone_number}",
                from_=f"+1{settings.TWILIO_PHONE_NUMBER}",
                body=body
            )
            logger.info(f'Sent Twilio message with sid {msg.sid}.')
            return msg.sid
        except Exception:
            if fail_silently:
                logger.exception(f'Error while communicating with Twilio')
                return ''
            else:
                raise
    else:
        logger.info(
            f'SMS sending is disabled. If it were enabled, '
            f'{phone_number} would receive a text message '
            f'with the body {repr(body)}.'
        )
        return ''


def _lookup_phone_number(phone_number: str, type: str = '') -> Optional[PhoneNumberInstance]:
    if not settings.TWILIO_ACCOUNT_SID:
        return None
    client = get_client()
    ctx = client.lookups.phone_numbers.get(f'+1{phone_number}')
    info = ctx.fetch(type=type)
    assert isinstance(info, PhoneNumberInstance)
    return info


def get_carrier_info(phone_number: str) -> Optional[Dict[str, Any]]:
    '''
    Use Twilio's Lookup API to retrieve carrier information for
    the given phone number.

    The return value will be a dictionary with the format specified here:

        https://www.twilio.com/docs/lookup/api#lookups-carrier-info

    However, the documentation describes the keys as being in camel-case,
    while in reality they seem to be in snake-case.

    If Twilio integration is disabled, a network error occurs, or
    the phone number is invalid, this function will return None.

    Note that using this function will cost money ($0.005 as of
    the time of this writing). Ideally the result should be cached
    to minimize that cost.
    '''

    try:
        info = _lookup_phone_number(phone_number, type='carrier')
        return info and info.carrier
    except TwilioRestException:
        logger.exception(f'Error while communicating with Twilio')
        return None


def is_phone_number_valid(phone_number: str) -> Optional[bool]:
    '''
    Check the validity of the given phone number using Twilio's
    Lookup API.

    If Twilio integration is disabled or a network error occurs,
    this function will return None.

    Otherwise, it will return a boolean indicating the validity
    of the phone number.

    Because this function can return either None or False, be
    sure to explicitly test against one of these, rather than
    merely testing "falsiness", e.g.:

        >>> if is_phone_number_valid('5551234567') is False:
        ...     print("Invalid phone number!")
    '''

    try:
        info = _lookup_phone_number(phone_number)
        return None if info is None else True
    except TwilioRestException as e:
        if e.code == 20404:
            return False
        else:
            logger.exception(f'Error while communicating with Twilio')
            return None
