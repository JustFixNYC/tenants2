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
    verify_time: int = request.session.get(SESSION_KEY, 0)
    expiry_time = verify_time + settings.TWOFACTOR_VERIFY_DURATION
    return expiry_time >= time.time()


def verify_request_user(request: HttpRequest) -> None:
    '''
    Classify the currently logged-in user as verified. This also
    ensures that the user's secret will never be revealed to
    them again.
    '''

    assert request.user.is_authenticated
    request.session[SESSION_KEY] = int(time.time())

    twofactor = request.user.twofactor_info
    twofactor.has_user_seen_secret_yet = True
    twofactor.save()
