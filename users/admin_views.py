import logging
from django.http import HttpResponseForbidden
from django.template.response import TemplateResponse
from django.shortcuts import get_object_or_404, redirect
from django.urls import path

from . import impersonation
from .models import JustfixUser


logger = logging.getLogger(__name__)


class UserAdminViews:
    def __init__(self, site):
        self.site = site

    def get_urls(self):
        return [
            path(
                "impersonate/<int:user_id>/",
                self.site.admin_view(self.impersonate_user),
                name="impersonate-user",
            ),
        ]

    def impersonate_user(self, request, user_id):
        user = request.user
        other_user = get_object_or_404(JustfixUser, pk=user_id)
        reason = impersonation.get_reason_for_denying_impersonation(user, other_user)
        if request.method == "POST":
            if reason:
                logger.error(f"Denied {user} from impersonating {other_user}: {reason}")
                return HttpResponseForbidden(reason)
            impersonation.impersonate_user(request, other_user)
            logger.info(f"{user} started impersonating {other_user}.")
            return redirect("/")

        return TemplateResponse(
            request,
            "users/admin/impersonate_user.html",
            {
                "noimpersonate_reason": reason,
                "other_user": other_user,
            },
        )
