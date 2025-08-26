import base64
import logging
from io import BytesIO
from django.http.response import FileResponse
from django.utils import timezone
from django.db import transaction

from frontend.static_content import Email
from project import slack
from project.util.demo_deployment import is_not_demo_deployment
from gceletter.models import GCELETTER_MAILING_CHOICES, GCELetter, LandlordDetails, UserDetails
from gceletter.views import render_pdf_bytes
from project.util.email_attachment import email_file_response_as_attachment
from project.util.html_to_text import html_to_text
from project.util.letter_sending import send_letter_via_lob

# Set to true when we are ready to test LOB letter sending
LETTER_SENDING_ENABLED = False

logger = logging.getLogger(__name__)


def render_pdf_bytes(html: str, css: str = None) -> bytes:
    import weasyprint
    from weasyprint.fonts import FontConfiguration

    font_config = FontConfiguration()

    # see loc/views.py render_pdf_bytes() for adding stylesheets

    return weasyprint.HTML(string=html).write_pdf(font_config=font_config)


def gceletter_pdf_response(pdf_bytes: bytes) -> FileResponse:
    """
    Creates a FileResponse for the given PDF bytes and an
    appropriate filename for the GCE letter.
    """

    return FileResponse(BytesIO(pdf_bytes), filename=f"good-cause-letter.pdf")


def email_letter_to_user(letter: GCELetter, pdf_bytes: bytes):
    ud = letter.landlord_details
    assert ud.email

    if is_not_demo_deployment(f"emailing {letter} to user"):
        email = Email(
            subject="test gce letter email",
            body=html_to_text(letter.html_content),
            html_body=letter.html_content,
        )
        attachment = gceletter_pdf_response(pdf_bytes)
        email_file_response_as_attachment(
            subject=email.subject,
            body=email.body,
            html_body=email.html_body,
            recipients=ud.email,
            attachment=attachment,
        )

    return True


def email_letter_to_landlord(letter: GCELetter, pdf_bytes: bytes):
    if letter.letter_emailed_at is not None:
        logger.info(f"{letter} has already been emailed to the landlord.")
        return False
    ld = letter.landlord_details
    assert ld.email

    if is_not_demo_deployment(f"emailing {letter} to landlord"):

        email = Email(
            subject="test gce letter email",
            body=html_to_text(letter.html_content),
            html_body=letter.html_content,
        )
        attachment = gceletter_pdf_response(pdf_bytes)
        email_file_response_as_attachment(
            subject=email.subject,
            body=email.body,
            html_body=email.html_body,
            recipients=ld.email,
            attachment=attachment,
        )

    letter.letter_emailed_at = timezone.now()
    letter.save()
    return True


def send_letter(letter: GCELetter):
    ud = letter.user_details
    ld = letter.landlord_details

    pdf_bytes = render_pdf_bytes(letter.html_content)

    if ld.email and letter.email_to_landlord:
        email_letter_to_landlord(letter, pdf_bytes)

    if (
        ld.address_lines_for_mailing
        and letter.mail_choice == GCELETTER_MAILING_CHOICES.WE_WILL_MAIL
        and LETTER_SENDING_ENABLED
    ):
        send_letter_via_lob(
            letter,
            pdf_bytes,
            letter_description="Good Cause letter",
        )

    if ud.email:
        email_letter_to_user(letter, pdf_bytes)

    slack.sendmsg_async(
        f"{slack.hyperlink(text=ud.first_name, href=letter.admin_url)} "
        "has sent a Good Cause letter!",
        is_safe=True,
    )

    with transaction.atomic():
        letter.pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
        letter.fully_processed_at = timezone.now()
        letter.full_clean()
        letter.save()
