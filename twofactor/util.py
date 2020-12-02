import time
from django.conf import settings
from django.http import HttpRequest, HttpResponse
from django.contrib.auth.views import redirect_to_login
from django.urls import reverse


SESSION_KEY = "twofactor_verify_time"


def is_request_user_verified(request: HttpRequest) -> bool:
    """
    Return whether the currently logged-in user is verified.
    """

    if not request.user.is_authenticated:
        return False
    if settings.TWOFACTOR_VERIFY_DURATION <= 0:
        return True
    verify_time: int = request.session.get(SESSION_KEY, 0)
    expiry_time = verify_time + settings.TWOFACTOR_VERIFY_DURATION
    return expiry_time >= time.time()


def verify_request_user(request: HttpRequest) -> None:
    """
    Classify the currently logged-in user as verified.
    """

    assert request.user.is_authenticated
    request.session[SESSION_KEY] = int(time.time())


def redirect_request_to_verify(request: HttpRequest) -> HttpResponse:
    """
    Return an HTTP response that redirects the user
    to two-factor verification and then sends them
    back to the given request.
    """

    path = request.build_absolute_uri()
    # This function is called redirect_to_login, but
    # we're reusing it for its generic logic of
    # adding a 'next' querystring argument to a URL.
    return redirect_to_login(next=path, login_url=reverse("verify"), redirect_field_name="next")
