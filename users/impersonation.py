from typing import Any, Dict, List, Optional
from enum import Enum
import logging
from contextlib import contextmanager
from django.http import HttpRequest
from django.contrib import auth

from twofactor.util import SESSION_KEY as TWOFACTOR_SESSION_KEY
from .models import JustfixUser, IMPERSONATE_USERS_PERMISSION


SESSION_KEY = "user_impersonated_by"

logger = logging.getLogger(__name__)


class ImpersonationDenialReason(Enum):
    NOT_AUTHENTICATED = "You must be authenticated."

    NOT_ACTIVE_STAFF_MEMBER = "You must be an active staff member to impersonate a user."

    NEEDS_IMPERSONATE_USERS_PERMISSION = "You do not have permission to impersonate users."

    NOT_SUPERUSER = "You must be a superuser to impersonate staff members."


def get_reason_for_denying_impersonation(
    user: JustfixUser, other_user: JustfixUser
) -> Optional[ImpersonationDenialReason]:
    """
    Return the reason for why `user` cannot impersonate `other_user`. If
    no reason exists, the user *can* impersonate the other user, and
    this function will return `None`.
    """

    if not user.is_authenticated:
        return ImpersonationDenialReason.NOT_AUTHENTICATED
    if not (user.is_active and user.is_staff):
        return ImpersonationDenialReason.NOT_ACTIVE_STAFF_MEMBER
    if not user.has_perm(IMPERSONATE_USERS_PERMISSION):
        return ImpersonationDenialReason.NEEDS_IMPERSONATE_USERS_PERMISSION
    if (other_user.is_staff or other_user.is_superuser) and not user.is_superuser:
        return ImpersonationDenialReason.NOT_SUPERUSER
    return None


def can_user_impersonate(user: JustfixUser, other_user: JustfixUser) -> bool:
    """
    Return whether `user` can impersonate `other_user`.
    """

    return get_reason_for_denying_impersonation(user, other_user) is None


def impersonate_user(request: HttpRequest, other_user: JustfixUser):
    """
    Make the user of the current request impersonate the other user.
    """

    user = request.user
    assert can_user_impersonate(user, other_user), "Impersonator must have permission"
    _switch_to(request, other_user)
    request.session[SESSION_KEY] = user.pk
    logger.info(f"{user} started impersonating {other_user}.")


def get_impersonating_user(request: HttpRequest) -> Optional[JustfixUser]:
    """
    Get the user impersonating the current user, if any.
    """

    if hasattr(request, "session") and SESSION_KEY in request.session:
        return JustfixUser.objects.get(pk=request.session[SESSION_KEY])
    return None


def unimpersonate_user(request: HttpRequest):
    """
    Make the current user stop impersonating.
    """

    user = request.user
    other_user = get_impersonating_user(request)
    assert other_user is not None, "User must be impersonating"
    _switch_to(request, other_user)
    logger.info(f"{other_user} stopped impersonating {user}.")


def _switch_to(request, user):
    # http://stackoverflow.com/a/2787747
    user.backend = "django.contrib.auth.backends.ModelBackend"

    # We don't want the staff user to have to re-authentica 2FA when
    # they switch in/out of impersonation, so let's preserve that
    # particular session key.
    with preserve_session_keys(request, [TWOFACTOR_SESSION_KEY]):
        auth.login(request, user)


@contextmanager
def preserve_session_keys(req: HttpRequest, keys: List[str]):
    """
    Context manager to preserve the given request session keys
    across the `with` statement they are applied to.

    This can be used e.g. to ensure that some aspects of the
    user's session are preserved across login or logout.
    """

    keys_dict: Dict[str, Any] = {}
    try:
        keys_dict = {key: req.session[key] for key in keys if key in req.session}
        yield
    finally:
        req.session.update(keys_dict)
