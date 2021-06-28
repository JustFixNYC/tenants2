import time
import logging
from typing import Optional
from django.utils.crypto import get_random_string, constant_time_compare
from django.http import HttpRequest
from django.utils.translation import gettext as _
from django.core.mail import send_mail
from django.conf import settings

from . import slack
from .util.site_util import get_site_name
from texting import twilio
from users.models import JustfixUser

# Number of characters in the verification code.
VCODE_LENGTH = 6

# Character set of the verification code. We want it to be all
# digits.
VCODE_CHARS = "0123456789"

# Session key where we put the verification code we sent the user.
VCODE_SESSION_KEY = "password_reset_vcode"

# Session key where we put the user ID of the user whose password
# is to be reset.
USER_ID_SESSION_KEY = "password_reset_user_id"

# Session key where we put the time the verification code was sent,
# in seconds since the epoch.
TIMESTAMP_SESSION_KEY = "password_reset_ts"

# Session key where we put the time the user verified their
# verification code, in seconds since the epoch.
VERIFIED_TIMESTAMP_SESSION_KEY = "password_reset_verified_ts"

# The amount of time the user has to enter their verification code, in seconds.
VERIFICATION_MAX_SECS = 60 * 5

# The amount of time the user has to set a new password, in seconds.
NEW_PASSWORD_MAX_SECS = 60 * 15


logger = logging.getLogger(__name__)


def create_verification_code(request: HttpRequest, phone_number: str):
    """
    Create a verification code for the user with the given phone number,
    store it in the request session, and text it to the user.

    If the phone number doesn't correspond to a user, log a warning. (We
    don't want to leak information by telling the user that the
    phone number is invalid.)
    """

    user = JustfixUser.objects.filter(phone_number=phone_number).first()
    if user is None:
        logger.warning("Phone number does not map to a valid user account.")
        return
    vcode = get_random_string(length=VCODE_LENGTH, allowed_chars=VCODE_CHARS)
    request.session[USER_ID_SESSION_KEY] = user.pk
    request.session[VCODE_SESSION_KEY] = vcode
    request.session[TIMESTAMP_SESSION_KEY] = time.time()
    ctx = {
        "site_name": get_site_name(),
        "code": vcode,
    }
    subject = _("Your %(site_name)s verification code") % ctx
    body = _("%(site_name)s here! Your verification code is %(code)s.") % ctx
    twilio.send_sms_async(phone_number, body)
    if user.email:
        send_mail(
            subject,
            body,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
        f"has started the password reset process.",
        is_safe=True,
    )


def verify_verification_code(request: HttpRequest, vcode: str) -> Optional[str]:
    """
    Verify that the given verification code is identical to the one
    stored in the request session. If anything is amiss, return a
    string describing the error; otherwise, return None.
    """

    # Remember that if the user submitted an invalid phone number in the
    # previous step, we don't want to leak that information here.

    req_vcode = request.session.get(VCODE_SESSION_KEY)

    if not constant_time_compare(req_vcode, vcode):
        if req_vcode is not None:
            req_user_id = request.session.get(USER_ID_SESSION_KEY)
            logger.info(f"Invalid verification code for user id {req_user_id}.")
        return "Incorrect verification code!"

    req_ts = request.session.get(TIMESTAMP_SESSION_KEY, 0)

    now = time.time()
    time_elapsed = now - req_ts

    if time_elapsed > VERIFICATION_MAX_SECS:
        return "Verification code expired. Please go back and re-enter your phone number."

    del request.session[VCODE_SESSION_KEY]
    del request.session[TIMESTAMP_SESSION_KEY]

    request.session[VERIFIED_TIMESTAMP_SESSION_KEY] = now

    return None


def get_user_id_of_password_reset_user(request: HttpRequest) -> Optional[int]:
    """
    Returns the user ID of the user who is trying to reset their password,
    or None if it doesn't exist.
    """

    return request.session.get(USER_ID_SESSION_KEY)


def set_password(request: HttpRequest, password: str) -> Optional[str]:
    """
    Set the user's password. If anything is amiss, return a string
    describing the error; otherwise, return None.
    """

    req_user_id = request.session.get(USER_ID_SESSION_KEY)
    req_ts = request.session.get(VERIFIED_TIMESTAMP_SESSION_KEY, 0)

    now = time.time()
    time_elapsed = now - req_ts

    if req_user_id is None or time_elapsed > NEW_PASSWORD_MAX_SECS:
        return "Please go back and re-enter your phone number."

    user = JustfixUser.objects.get(pk=req_user_id)
    user.set_password(password)
    user.save()
    logger.info(f"User {user.username} has changed their password.")
    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
        f"has changed their password.",
        is_safe=True,
    )

    del request.session[USER_ID_SESSION_KEY]
    del request.session[VERIFIED_TIMESTAMP_SESSION_KEY]

    return None
