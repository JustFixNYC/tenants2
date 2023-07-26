import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from django.conf import settings
from twilio.rest import Client
from twilio.http.http_client import TwilioHttpClient
from twilio.base.exceptions import TwilioRestException
from twilio.rest.lookups.v1.phone_number import PhoneNumberInstance

from project.util.settings_util import ensure_dependent_settings_are_nonempty
from project.util.celery_util import fire_and_forget_task, get_task_for_function

logger = logging.getLogger(__name__)


# https://www.twilio.com/docs/api/errors/21211
TWILIO_INVALID_TO_NUMBER_ERR = 21211

# https://www.twilio.com/docs/api/errors/21610
TWILIO_BLOCKED_NUMBER_ERR = 21610

# Other type of error communicating w/ Twilio, e.g. unable to contact
# their server or something.
TWILIO_OTHER_ERR = -1

# The user opted-out of SMS communications on our end.
TWILIO_USER_OPTED_OUT_ERR = -2

# Twilio integration is disabled, so the SMS wasn't sent.
TWILIO_INTEGRATION_DISABLED_ERR = -3

# A set of error codes that indicate that we shouldn't bother
# to try re-sending the SMS.
TWILIO_NO_RETRY_ERRS = set(
    [
        TWILIO_INVALID_TO_NUMBER_ERR,
        TWILIO_BLOCKED_NUMBER_ERR,
        TWILIO_USER_OPTED_OUT_ERR,
        TWILIO_INTEGRATION_DISABLED_ERR,
    ]
)


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


@dataclass
class SendSmsResult:
    """
    The result of attempting to send an SMS.  If successful, `sid` will be
    non-empty.  Otherwise, `err_code` will be an integer describing the
    error.  If it is non-negative, it corresponds to a Twilio REST API error
    code defined here:

       https://www.twilio.com/docs/api/errors

    Otherwise, it will correspond to an application-specific error code;
    see the `TWILIO_*_ERR` constants in this file for more details.
    """

    sid: str = ""

    err_code: Optional[int] = None

    def __post_init__(self):
        if (not self.sid) and self.err_code is None:
            raise ValueError("SendSmsResult must be either successful or unsuccessful")
        if self.sid and self.err_code is not None:
            raise ValueError("SendSmsResult can't be both successful and unsuccessful")

    @property
    def should_retry(self) -> bool:
        """
        Returns whether we should bother trying to retry sending the SMS.
        """

        if self.sid or self.err_code in TWILIO_NO_RETRY_ERRS:
            return False
        return True

    def __bool__(self) -> bool:
        """
        This object will be falsy if the SMS wasn't sent.
        """

        return bool(self.sid)


def _handle_twilio_err(
    e: Exception, phone_number: str, fail_silently: bool, ignore_invalid_phone_number: bool
) -> Optional[SendSmsResult]:
    """
    Attempt to handle an exception raised by Twilio. Returns None if the exception should
    be propagated; otherwise, returns a `SendSmsResult` object with `err_code` set to
    an appropriate value.
    """

    from .models import PhoneNumberLookup

    code: int = e.code if isinstance(e, TwilioRestException) else TWILIO_OTHER_ERR

    if code == TWILIO_INVALID_TO_NUMBER_ERR:
        logger.info(f"Phone number {phone_number} is invalid.")
        PhoneNumberLookup.objects.invalidate(phone_number=phone_number)
        if ignore_invalid_phone_number:
            return SendSmsResult(err_code=code)
    if fail_silently:
        if code == TWILIO_BLOCKED_NUMBER_ERR:
            logger.info(f"Phone number {phone_number} is blocked.")
        else:
            logger.exception(f"Error while communicating with Twilio")
        return SendSmsResult(err_code=code)

    return None


def send_sms(
    phone_number: str,
    body: str,
    media_url=None,
    fail_silently=False,
    ignore_invalid_phone_number=True,
) -> SendSmsResult:
    """
    Send an SMS message to the given phone number, with the given body.

    If `fail_silently` is True, any exceptions raised will be logged,
    but not propagated.  Any kind of error will be represented in the
    return value's `err_code` property.

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
                return SendSmsResult(err_code=TWILIO_INVALID_TO_NUMBER_ERR)
        client = get_client()
        try:
            if media_url is not None:
                msg = client.messages.create(
                    to=tendigit_to_e164(phone_number),
                    from_=tendigit_to_e164(settings.TWILIO_PHONE_NUMBER),
                    body=body,
                    mediaUrl=media_url,
                )
            else:
                msg = client.messages.create(
                    to=tendigit_to_e164(phone_number),
                    from_=tendigit_to_e164(settings.TWILIO_PHONE_NUMBER),
                    body=body,
                )
            logger.info(f"Sent Twilio message with sid {msg.sid}.")
            return SendSmsResult(sid=msg.sid)
        except Exception as e:
            result = _handle_twilio_err(e, phone_number, fail_silently, ignore_invalid_phone_number)
            if result is not None:
                return result
            raise
    else:
        logger.info(
            f"SMS sending is disabled. If it were enabled, "
            f"{phone_number} would receive a text message "
            f"with the body {repr(body)}."
        )
        return SendSmsResult(err_code=TWILIO_INTEGRATION_DISABLED_ERR)


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
    media_substr = "media_url="
    for body in bodies:
        # bit jank but unless i rework the whole chaining system theres not a good way ?
        if body.find(media_substr):
            media_url = body.split(media_substr)[1]
            sig = task.si(phone_number, body, media_url)
        else:
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
