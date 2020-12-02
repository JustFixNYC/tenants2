from celery import shared_task

from . import email_letter

shared_task(ignore_result=True)(email_letter.email_letter)


@shared_task
def send_admin_notification_for_letter(letter_id: int):
    from django.template.loader import render_to_string
    from django.core.mail import EmailMessage
    from django.conf import settings

    from project.util.site_util import absolute_reverse
    from .models import LetterRequest, LOC_MAILING_CHOICES

    letter = LetterRequest.objects.get(id=letter_id)
    user = letter.user

    assert letter.mail_choice == LOC_MAILING_CHOICES.WE_WILL_MAIL

    body = render_to_string(
        "loc/admin/notification-email.txt",
        {
            "user": user,
            "letter": letter,
            "send_letter_url": absolute_reverse(
                "admin:mail-via-lob", kwargs={"letterid": letter.id}
            ),
            "edit_letter_url": absolute_reverse("admin:loc_locuser_change", args=(user.pk,)),
        },
    )
    subject = f"Letter of Complaint request for {user.full_name}"

    msg = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.LOC_EMAIL],
        reply_to=[user.email] if user.email else None,
    )
    msg.send()
