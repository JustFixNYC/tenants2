from typing import Union
import urllib.parse
from django.core.mail import send_mail
from django.conf import settings
from django.core import signing

from project.util.site_util import absolute_reverse
from users.models import JustfixUser


VERIFICATION_SALT = "verification"

SECONDS_PER_DAY = 86400

MAX_VERIFICATION_DAYS = 7

VERIFY_EXPIRED = "expired"
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


def verify_code(code: str) -> Union[str, JustfixUser]:
    try:
        username = signing.loads(
            code,
            salt=VERIFICATION_SALT,
            max_age=MAX_VERIFICATION_DAYS * SECONDS_PER_DAY,
        )
        user = JustfixUser.objects.filter(username=username).first()
        if user is None:
            return VERIFY_INVALID_USERNAME
        user.is_email_verified = True
        user.save()
        return user
    except signing.SignatureExpired:
        return VERIFY_EXPIRED
    except signing.BadSignature:
        return VERIFY_INVALID_CODE
