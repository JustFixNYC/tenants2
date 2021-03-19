import functools
import logging
from typing import Dict
from urllib.parse import urlparse, parse_qsl
from django.conf import settings
from django.utils.crypto import constant_time_compare
from csp.decorators import csp_update
import requests

from users.models import JustfixUser


logger = logging.getLogger(__name__)


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


def sync_user_with_frontapp(user: JustfixUser) -> bool:
    """
    Creates a Front contact for the given user if one doesn't already exist,
    and sets its name and phone number.

    If Front integration is disabled, or if the user doesn't have their name
    set, this does nothing.

    Returns whether or not the user was synced.
    """

    if not (settings.FRONTAPP_API_TOKEN and user.full_name):
        return False

    base_url = "https://api2.frontapp.com/contacts"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.FRONTAPP_API_TOKEN}",
    }

    source = "phone"

    handle = f"+1{user.phone_number}"

    contact_id = f"alt:{source}:{handle}"

    base_contact_info = {
        "name": user.full_name,
    }

    patch_response = requests.request(
        "PATCH",
        f"{base_url}/{contact_id}",
        headers=headers,
        json=base_contact_info,
        timeout=settings.FRONTAPP_TIMEOUT,
    )

    if patch_response.status_code == 404:
        post_response = requests.request(
            "POST",
            base_url,
            headers=headers,
            json={
                **base_contact_info,
                "handles": [
                    {
                        "handle": handle,
                        "source": source,
                    }
                ],
            },
        )
        post_response.raise_for_status()
        logger.info(f"Synced {user} with Front via POST.")
    else:
        patch_response.raise_for_status()
        logger.info(f"Synced {user} with Front via PATCH.")

    return True
