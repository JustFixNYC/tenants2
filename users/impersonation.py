from typing import Optional
import logging
from django.http import HttpRequest
from django.contrib import auth

from .models import JustfixUser, IMPERSONATE_USERS_PERMISSION


SESSION_KEY = "user_impersonated_by"

logger = logging.getLogger(__name__)


def get_reason_for_denying_impersonation(
    user: JustfixUser, other_user: JustfixUser
) -> Optional[str]:
    """
    Return the reason for why `user` cannot impersonate `other_user`. If
    no reason exists, the user *can* impersonate the other user, and
    this function will return `None`.
    """

    if not user.is_authenticated:
        return "You must be authenticated."
    if not (user.is_active and user.is_staff):
        return "You must be an active staff member to impersonate a user."
    if not user.has_perm(IMPERSONATE_USERS_PERMISSION):
        return "You do not have permission to impersonate users."
    if (other_user.is_staff or other_user.is_superuser) and not user.is_superuser:
        return "You must be a superuser to impersonate staff members."
    return None


def can_user_impersonate(user: JustfixUser, other_user: JustfixUser) -> bool:
    """
    Return whether `user` can impersonate `other_user`.
    """

    return not bool(get_reason_for_denying_impersonation(user, other_user))


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

    if SESSION_KEY in request.session:
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
    auth.login(request, user)
