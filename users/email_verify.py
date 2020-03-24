from typing import Tuple, Optional
import urllib.parse
from django.core.mail import send_mail
from django.conf import settings
from django.core import signing

from project.util.site_util import absolute_reverse
from users.models import JustfixUser


VERIFICATION_SALT = "verification"

SECONDS_PER_DAY = 86400

MAX_VERIFICATION_DAYS = 7

VERIFY_OK = "ok"
VERIFY_EXPIRED = "expired"
VERIFY_ALREADY_VERIFIED = "already_verified"
VERIFY_INVALID_CODE = "invalid_code"
VERIFY_INVALID_USERNAME = "invalid_username"


def send_verification_email(user: JustfixUser):
    assert user.email
    code = signing.dumps(user.username, salt=VERIFICATION_SALT)
    qs = urllib.parse.urlencode({'code': code})
    url = f"{absolute_reverse('verify_email')}?{qs}"
    subject = f"Welcome to JustFix.nyc! Please verify your email"
    body = f"To verify your email, follow this link: {url}"
    from_email = settings.DEFAULT_FROM_EMAIL
    send_mail(subject, body, from_email, [user.email])


def verify_code(code: str) -> Tuple[str, Optional[JustfixUser]]:
    '''
    Attempt to verify the given verification code and apply it
    to the user that it represents. Returns a tuple containing
    the response code string and the relevant user object, if
    applicable.
    '''

    try:
        username = signing.loads(
            code,
            salt=VERIFICATION_SALT,
            max_age=MAX_VERIFICATION_DAYS * SECONDS_PER_DAY,
        )
        user = JustfixUser.objects.filter(username=username).first()
        if user is None:
            return (VERIFY_INVALID_USERNAME, None)
        if user.is_email_verified:
            return (VERIFY_ALREADY_VERIFIED, user)
        user.is_email_verified = True
        user.save()
        return (VERIFY_OK, user)
    except signing.SignatureExpired:
        return (VERIFY_EXPIRED, None)
    except signing.BadSignature:
        return (VERIFY_INVALID_CODE, None)
