import time
import logging
from typing import Optional
from django.utils.crypto import get_random_string
from django.http import HttpRequest

from texting import twilio
from users.models import JustfixUser

# Number of characters in the verification code.
VCODE_LENGTH = 6

# Character set of the verification code. We want it to be all
# digits.
VCODE_CHARS = '0123456789'

# Session key where we put the verification code we sent the user.
VCODE_SESSION_KEY = 'password_reset_vcode'

# Session key where we put the time the verification code was sent,
# in seconds since the epoch.
TIMESTAMP_SESSION_KEY = 'password_reset_ts'

# Session key where we put the time the user verified their
# verification code, in seconds since the epoch.
VERIFIED_TIMESTAMP_SESSION_KEY = 'password_reset_verified_ts'

# The amount of time the user has to enter their verification code.
VERIFICATION_MAX_SECS = 60 * 5

# The amount of time the user has to set a new password.
NEW_PASSWORD_MAX_SECS = 60 * 60


logger = logging.getLogger(__name__)


def create_verification_code(request: HttpRequest, phone_number: str):
    '''
    Create a verification code for the user with the given phone number,
    store it in the request session, and text it to the user.

    If the phone number doesn't correspond to a user, log a warning. (We
    don't want to leak information by telling the user that the
    phone number is invalid.)
    '''

    user = JustfixUser.objects.filter(phone_number=phone_number).first()
    if user is None:
        logger.warning('Phone number does not map to a valid user account.')
        return
    vcode = get_random_string(length=VCODE_LENGTH, allowed_chars=VCODE_CHARS)
    request.session[VCODE_SESSION_KEY] = vcode
    request.session[TIMESTAMP_SESSION_KEY] = time.time()
    twilio.send_sms(
        phone_number,
        f"JustFix.nyc here! Your verification code is {vcode}.",
        fail_silently=True
    )


def verify_verification_code(request: HttpRequest, vcode: str) -> Optional[str]:
    '''
    Verify that the given verification code is identical to the one
    stored in the request session. If anything is amiss, return a
    string describing the error; otherwise, return None.
    '''

    req_vcode = request.session.get(VCODE_SESSION_KEY)
    req_ts = request.session.get(TIMESTAMP_SESSION_KEY, 0)

    now = time.time()
    time_elapsed = now - req_ts

    if req_vcode is None or time_elapsed > VERIFICATION_MAX_SECS:
        return "Verification code expired. Please go back and re-enter your phone number."

    if req_vcode != vcode:
        return "Incorrect verification code!"

    request.session[VERIFIED_TIMESTAMP_SESSION_KEY] = now

    return None
