from typing import Tuple, Optional, NamedTuple
import json
import urllib.parse
from django.core.mail import send_mail
from django.conf import settings
from django.core import signing
from django.template.loader import render_to_string

from project.util.celery_util import fire_and_forget_task
from project.util.site_util import absolute_reverse
from users.models import JustfixUser

# A bunch of the logic in this module was taken from django-registration,
# specifically its file `django_registration/backends/activation/views.py`.

VERIFICATION_SALT = "verification"

SECONDS_PER_DAY = 86400

MAX_VERIFICATION_DAYS = 7

VERIFY_OK = "ok"
VERIFY_EXPIRED = "expired"
VERIFY_ALREADY_VERIFIED = "already_verified"
VERIFY_INVALID_CODE = "invalid_code"
VERIFY_EMAIL_MISMATCH = "email_mismatch"
VERIFY_MALFORMED_PAYLOAD = "malformed_payload"
VERIFY_INVALID_USERNAME = "invalid_username"


class SigningPayload(NamedTuple):
    """
    The object we encode and sign in an email verification email.

    Note that we want to include the email address of the user in this
    payload to prevent users from changing their email to something
    they don't own and then clicking an old verification link.
    """

    username: str
    email: str

    @staticmethod
    def from_user(user: JustfixUser) -> "SigningPayload":
        return SigningPayload(user.username, user.email)

    @staticmethod
    def deserialize(value: str) -> Optional["SigningPayload"]:
        try:
            value = json.loads(value)
            if not isinstance(value, list):
                raise ValueError("payload should be a list")
            username, email = value
            if not (isinstance(username, str) and isinstance(email, str)):
                raise ValueError("both username and email should be strings")
            return SigningPayload(username, email)
        except Exception:
            return None

    def serialize(self) -> str:
        return json.dumps([self.username, self.email])


def send_verification_email(user_id: int):
    """
    Sends an email to the user with the given ID with a link to follow;
    when they follow the link, their account will be marked
    as having a validated email address.
    """

    user = JustfixUser.objects.get(pk=user_id)
    assert user.email
    code = signing.dumps(SigningPayload.from_user(user).serialize(), salt=VERIFICATION_SALT)
    qs = urllib.parse.urlencode({"code": code})
    url = f"{absolute_reverse('verify_email')}?{qs}"
    subject = f"Welcome to JustFix! Please verify your email"
    body = render_to_string(
        "users/verification_email_body.txt",
        {
            "user": user,
            "url": url,
        },
    )
    from_email = settings.DEFAULT_FROM_EMAIL
    send_mail(subject, body, from_email, [user.email])


send_verification_email_async = fire_and_forget_task(send_verification_email)


def verify_code(code: str) -> Tuple[str, Optional[JustfixUser]]:
    """
    Attempt to verify the given verification code and mark
    the user's account as having a verified email address.

    Returns a tuple containing the response code string and
    the relevant user object, if applicable.

    Note that if the user object is included, the verification
    can be considered a success.
    """

    try:
        payload = SigningPayload.deserialize(
            signing.loads(
                code,
                salt=VERIFICATION_SALT,
                max_age=MAX_VERIFICATION_DAYS * SECONDS_PER_DAY,
            )
        )
        if payload is None:
            return (VERIFY_MALFORMED_PAYLOAD, None)
        user = JustfixUser.objects.filter(username=payload.username).first()
        if user is None:
            return (VERIFY_INVALID_USERNAME, None)
        if not (user.email and user.email == payload.email):
            # Even though we have the user object, we don't want to return
            # it because the verification was not successful.
            return (VERIFY_EMAIL_MISMATCH, None)
        if user.is_email_verified:
            return (VERIFY_ALREADY_VERIFIED, user)
        user.is_email_verified = True
        user.save()
        return (VERIFY_OK, user)
    except signing.SignatureExpired:
        return (VERIFY_EXPIRED, None)
    except signing.BadSignature:
        return (VERIFY_INVALID_CODE, None)
