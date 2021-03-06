import logging
from typing import Optional, Dict, Any, List
from django.conf import settings
from twilio.rest import Client
from twilio.http.http_client import TwilioHttpClient
from twilio.base.exceptions import TwilioRestException
from twilio.rest.lookups.v1.phone_number import PhoneNumberInstance

from project.util.settings_util import ensure_dependent_settings_are_nonempty
from project.util.celery_util import fire_and_forget_task, get_task_for_function

logger = logging.getLogger(__name__)


def validate_settings():
    """
    Ensure that the Twilio-related settings are defined properly.
    """

    ensure_dependent_settings_are_nonempty(
        "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"
    )


class JustfixHttpClient(TwilioHttpClient):
    """
    Just like the standard Twilio HTTP client, but with a default timeout
    to ensure that our server doesn't hang if Twilio becomes unresponsive.
    """

    def request(self, *args, **kwargs):
        timeout = kwargs.get("timeout")
        if timeout is None:
            kwargs["timeout"] = settings.TWILIO_TIMEOUT
        return super().request(*args, **kwargs)


def get_client() -> Client:
    """
    Return a Twilio client configured to use the Twilio API keys
    defined by the Django settings.
    """

    return Client(
        settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, http_client=JustfixHttpClient()
    )


def tendigit_to_e164(phone_number: str) -> str:
    """
    Convert a ten-digit phone number to an E.164 one.

    >>> tendigit_to_e164('5551234567')
    '+15551234567'
    """

    return f"+1{phone_number}"


def is_enabled() -> bool:
    """
    Returns whether Twilio support is enabled.
    """

    return bool(settings.TWILIO_ACCOUNT_SID)


def send_sms(
    phone_number: str,
    body: str,
    fail_silently=False,
    ignore_invalid_phone_number=True,
) -> str:
    """
    Send an SMS message to the given phone number, with the given body.

    On success, the sid of the SMS message is returned. On failure
    (or if Twilio integration is disabled), an empty string is returned.

    If `fail_silently` is True, any exceptions raised will be logged,
    but not propagated.

    If `ignore_invalid_phone_number' is True, any exceptions raised
    related to invalid phone numbers will be logged, but not
    propagated. Furthermore, the SMS won't even be sent if we
    know the phone number is invalid.
    """

    if settings.TWILIO_ACCOUNT_SID:
        from .models import PhoneNumberLookup

        if ignore_invalid_phone_number:
            lookup = PhoneNumberLookup.objects.filter(phone_number=phone_number).first()
            if lookup and not lookup.is_valid:
                logger.info(f"Phone number {phone_number} is invalid, not sending SMS.")
                return ""
        client = get_client()
        try:
            msg = client.messages.create(
                to=tendigit_to_e164(phone_number),
                from_=tendigit_to_e164(settings.TWILIO_PHONE_NUMBER),
                body=body,
            )
            logger.info(f"Sent Twilio message with sid {msg.sid}.")
            return msg.sid
        except Exception as e:
            is_invalid_number = isinstance(e, TwilioRestException) and e.code == 21211
            if is_invalid_number:
                logger.info(f"Phone number {phone_number} is invalid.")
                PhoneNumberLookup.objects.invalidate(phone_number=phone_number)
                if ignore_invalid_phone_number:
                    return ""
            if fail_silently:
                logger.exception(f"Error while communicating with Twilio")
                return ""
            else:
                raise
    else:
        logger.info(
            f"SMS sending is disabled. If it were enabled, "
            f"{phone_number} would receive a text message "
            f"with the body {repr(body)}."
        )
        return ""


send_sms_async = fire_and_forget_task(send_sms)


def chain_sms_async(
    phone_number: str, bodies: List[str], seconds_between_messages: int = 10
) -> None:
    """
    Sends multiple SMS messages, waiting the given number
    of seconds between them, to ensure that the recipient
    doesn't receive them out of order.
    """

    import celery

    task = get_task_for_function(send_sms)
    tasks: List[Any] = []
    for body in bodies:
        sig = task.si(phone_number, body)
        if tasks:
            sig = sig.set(countdown=seconds_between_messages)
        tasks.append(sig)
    celery.chain(*tasks)()


def _lookup_phone_number(phone_number: str, type: str = "") -> Optional[PhoneNumberInstance]:
    if not settings.TWILIO_ACCOUNT_SID:
        return None
    client = get_client()
    ctx = client.lookups.phone_numbers.get(f"+1{phone_number}")
    info = ctx.fetch(type=type)
    assert isinstance(info, PhoneNumberInstance)
    return info


def get_carrier_info(phone_number: str) -> Optional[Dict[str, Any]]:
    """
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
    """

    try:
        info = _lookup_phone_number(phone_number, type="carrier")
        return info and info.carrier
    except TwilioRestException:
        logger.exception(f"Error while communicating with Twilio")
        return None


def is_phone_number_valid(phone_number: str) -> Optional[bool]:
    """
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
    """

    try:
        info = _lookup_phone_number(phone_number)
        return None if info is None else True
    except TwilioRestException as e:
        if e.code == 20404:
            return False
        else:
            logger.exception(f"Error while communicating with Twilio")
            return None
