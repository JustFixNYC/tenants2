from typing import Optional, Union
import re
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from users.models import JustfixUser
from .api import USER_ID_PREFIX


SETTINGS_URL_RE = re.compile(r"^(.+)\/([A-Za-z0-9]+)\/settings\/projects\/([0-9]+)\/general$")


def get_url_for_user_page(user: Union[int, JustfixUser]) -> Optional[str]:
    user_id: Optional[int] = user if isinstance(user, int) else user.pk
    if not (settings.AMPLITUDE_PROJECT_SETTINGS_URL and user_id):
        return None

    match = SETTINGS_URL_RE.match(settings.AMPLITUDE_PROJECT_SETTINGS_URL)

    if not match:
        raise ImproperlyConfigured("Unable to parse AMPLITUDE_PROJECT_SETTINGS_URL")

    origin = match.group(1)
    org_id = match.group(2)
    project_id = match.group(3)

    return f"{origin}/{org_id}/project/{project_id}/search/user_id%3D{USER_ID_PREFIX}{user_id}"
