import time
import logging
from django.utils.crypto import get_random_string
from django.http import HttpRequest

from texting import twilio
from users.models import JustfixUser


VCODE_SESSION_KEY = 'password_reset_vcode'

TIMESTAMP_SESSION_KEY = 'password_reset_timestamp'

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
    vcode = get_random_string(length=6, allowed_chars='0123456789')
    request.session[VCODE_SESSION_KEY] = vcode
    request.session[TIMESTAMP_SESSION_KEY] = time.time()
    twilio.send_sms(
        phone_number,
        f"JustFix.nyc here! Your verification code is {vcode}.",
        fail_silently=True
    )
