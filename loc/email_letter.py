from typing import List
from django.http import HttpRequest
from django.contrib.sessions.middleware import SessionMiddleware

from users.models import JustfixUser
from project.util.site_util import get_site_name
from project.util.celery_util import fire_and_forget_task
from project.util.email_attachment import email_file_response_as_attachment
from .views import render_finished_loc_pdf_for_user


def email_letter(user_id: int, recipients: List[str]) -> None:
    user = JustfixUser.objects.get(pk=user_id)
    request = HttpRequest()
    SessionMiddleware().process_request(request)
    email_file_response_as_attachment(
        subject=f"{user.full_name}'s letter of complaint",
        body=(
            f"{get_site_name()} here! Attached is a copy of {user.full_name}'s letter of "
            f"complaint, which {user.first_name} requested we send you."
        ),
        recipients=recipients,
        attachment=render_finished_loc_pdf_for_user(request, user)
    )


email_letter_async = fire_and_forget_task(email_letter)
