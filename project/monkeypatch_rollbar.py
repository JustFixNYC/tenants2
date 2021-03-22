from typing import Optional
from contextlib import contextmanager
from django.http import HttpRequest
import rollbar
import threading


class CurrThreadRequest(threading.local):
    "Keep track of the current request of the current thread."

    value: Optional[HttpRequest] = None


_curr_rollbar_request = CurrThreadRequest()

_orig_rollbar_get_request = rollbar.get_request


@contextmanager
def set_current_rollbar_request(request: HttpRequest):
    """
    For the duration of the context, set the current
    thread's request so Rollbar can access it when reporting.
    """

    _curr_rollbar_request.value = request
    try:
        yield
    finally:
        _curr_rollbar_request.value = None


def _new_rollbar_get_request() -> Optional[HttpRequest]:
    """
    Monkeypatch `rollbar.get_request()` to return the Django
    request for the current thread.
    """

    req = _curr_rollbar_request.value
    if req is not None:
        return req

    # Note that we probably don't need to do this, as it will just
    # return None since Django doesn't have a concept of a
    # thread-local request (hence the reason for all this code),
    # but just in case Rollbar's default behavior changes, let's
    # delegate to it.
    return _orig_rollbar_get_request()


rollbar.get_request = _new_rollbar_get_request
