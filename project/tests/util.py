from unittest.mock import patch
from functools import wraps
from django.http import QueryDict
from django.conf import settings


def qdict(d=None):
    """
    Convert the given dictionary of lists into a QueryDict, or
    return an empty QueryDict if nothing is provided.
    """

    qd = QueryDict(mutable=True)
    if d is None:
        return qd
    for key in d:
        assert isinstance(d[key], list)
        qd.setlist(key, d[key])
    return qd


def simplepatch(*args, **kwargs):
    """
    Like unittest.mock.patch, but doesn't pass the mock in
    as an extra argument to the function it decorates.
    """

    def decorator(fn):
        @wraps(fn)
        def wrapper(*fn_args, **fn_kwargs):
            with patch(*args, **kwargs):
                return fn(*fn_args, **fn_kwargs)

        return wrapper

    return decorator


def strip_locale(url: str) -> str:
    """
    If the given URL has a locale prefix in its
    pathname, remove it. For example:

        >>> strip_locale('https://blah/blarg')
        'https://blah/blarg'

        >>> strip_locale('https://blah/en/blarg')
        'https://blah/blarg'

    Note that this function is deprecated, as it
    was only useful when we feature-flagged I18N
    support and wanted tests to work regardless
    of whether it was enabled. Now that I18N is
    always enabled, tests can just assume it's
    active.
    """

    # This isn't particularly precise, but it gets
    # the job done for testing, which is all we're
    # using it for.
    for lang, _ in settings.LANGUAGES:
        url = url.replace(f"/{lang}/", "/")

    return url
