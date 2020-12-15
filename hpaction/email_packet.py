from typing import List

from users.models import JustfixUser
from project.util.site_util import get_site_name
from project.util.celery_util import fire_and_forget_task
from project.util.email_attachment import email_file_response_as_attachment
from .views import get_latest_pdf_for_user
from .models import HP_ACTION_CHOICES


def email_packet(user_id: int, recipients: List[str]) -> None:
    user = JustfixUser.objects.get(pk=user_id)
    email_file_response_as_attachment(
        subject=f"{user.full_name}'s HP Action packet",
        body=(
            f"{get_site_name()} here! Attached is a copy of {user.full_name}'s HP Action packet, "
            f"which {user.first_name} requested we send you."
        ),
        recipients=recipients,
        attachment=get_latest_pdf_for_user(user, HP_ACTION_CHOICES.NORMAL),
    )


email_packet_async = fire_and_forget_task(email_packet)
