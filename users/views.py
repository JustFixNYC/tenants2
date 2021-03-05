from django.http import HttpResponse, HttpRequest, HttpResponseForbidden
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.urls import reverse
import logging

from project import slack
from .email_verify import verify_code
from . import email_verify as ev, impersonation

logger = logging.getLogger(__name__)


# The endpoint below is currently very temporary; we'll likely do a redirect
# from here to a view on the React front-end that provides a more
# streamlined user experience in the very near future.


def verify_email(request: HttpRequest) -> HttpResponse:
    code = request.GET.get("code", "")
    result, user = verify_code(code)
    if not user:
        if result not in [ev.VERIFY_EXPIRED, ev.VERIFY_INVALID_CODE]:
            logger.warning(f"Unusual verification result: {result}")
        return HttpResponse(
            f"Unfortunately, an error occurred and we were unable " f"to verify your account."
        )
    if result == ev.VERIFY_OK:
        slack.sendmsg_async(
            f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
            f"has verified their email address!",
            is_safe=True,
        )
    return HttpResponse(
        f"Thank you for verifying your email address! You may now " f"close this web page."
    )


@require_POST
@login_required
def unimpersonate_user(request: HttpRequest) -> HttpResponse:
    user = request.user
    other_user = impersonation.get_impersonating_user(request)
    if other_user is None:
        return HttpResponseForbidden("Not currently impersonating a user.")
    impersonation.unimpersonate_user(request)
    logger.info(f"{other_user} stopped impersonating {user}.")
    return reverse("admin:index")
