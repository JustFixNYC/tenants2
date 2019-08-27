from typing import List
from django.core.mail import EmailMessage
from django.http import HttpRequest
from django.contrib.sessions.middleware import SessionMiddleware

from users.models import JustfixUser
from project.util.celery_util import fire_and_forget_task
from .views import render_letter_of_complaint


def email_letter(user_id: int, recipients: List[str]) -> None:
    user = JustfixUser.objects.get(pk=user_id)
    request = HttpRequest()
    SessionMiddleware().process_request(request)
    response = render_letter_of_complaint(request, user, 'pdf')
    pdf_filename = response.filename
    pdf_bytes = response.getvalue()

    msg = EmailMessage(
        subject='Here is your PDF',
        body='Hi pal, here is your PDF.',
        to=recipients,
    )
    msg.attach(pdf_filename, pdf_bytes)
    msg.send()


email_letter_async = fire_and_forget_task(email_letter)
