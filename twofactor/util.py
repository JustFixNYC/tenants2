import time
from django.conf import settings
from django.http.request import HttpRequest


SESSION_KEY = 'twofactor_verify_time'


def is_request_user_verified(request: HttpRequest) -> bool:
    '''
    Return whether the currently logged-in user is verified.
    '''

    if not request.user.is_authenticated:
        return False
    if settings.TWOFACTOR_VERIFY_DURATION <= 0:
        return True
    verify_time: int = request.session.get(SESSION_KEY, 0)
    expiry_time = verify_time + settings.TWOFACTOR_VERIFY_DURATION
    return expiry_time >= time.time()


def verify_request_user(request: HttpRequest) -> None:
    '''
    Classify the currently logged-in user as verified.
    '''

    assert request.user.is_authenticated
    request.session[SESSION_KEY] = int(time.time())
