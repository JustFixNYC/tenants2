import functools
from typing import Dict
from urllib.parse import urlparse, parse_qsl
from django.conf import settings
from django.utils.crypto import constant_time_compare
from csp.decorators import csp_update


def __get_query_dict(url: str) -> Dict[str, str]:
    parsed = urlparse(url)
    return dict(parse_qsl(parsed.query))


def __has_auth_secret(query_args: Dict[str, str], auth_secret: str) -> bool:
    return constant_time_compare(query_args.get("auth_secret", ""), auth_secret)


def does_url_have_auth_secret(url: str, auth_secret: str) -> bool:
    if not auth_secret:
        return False
    query_args = __get_query_dict(url)
    if __has_auth_secret(query_args, auth_secret):
        return True
    next_url = query_args.get("next", "")
    return __has_auth_secret(__get_query_dict(next_url), auth_secret)


def embeddable_in_frontapp(view):
    embeddable_view = csp_update(
        FRAME_ANCESTORS=[
            "https://*.frontapp.com",
            "https://*.frontapplication.com",
        ]
    )(view)

    @functools.wraps(view)
    def wrapped_view(request, *args, **kwargs):
        v = view
        if does_url_have_auth_secret(request.get_full_path(), settings.FRONTAPP_PLUGIN_AUTH_SECRET):
            v = embeddable_view
        return v(request, *args, **kwargs)

    return wrapped_view
