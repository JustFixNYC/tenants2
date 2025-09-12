import base64
import logging
from io import BytesIO
from typing import Any, Dict
from django.http.response import FileResponse
from django.utils import timezone
from django.db import transaction

from texting import twilio
from project import slack
from project.util import lob_api
from frontend.static_content import Email
from lettergce.models import LetterGCE
from project.util.demo_deployment import is_not_demo_deployment
from project.util.email_attachment import email_file_response_as_attachment
from project.util.html_to_text import html_to_text
from project.util.letter_sending import USPS_TRACKING_URL_PREFIX

# Set to true when we are ready to test LOB letter sending
LETTER_SENDING_ENABLED = False

logger = logging.getLogger(__name__)


def render_pdf_bytes(html: str, css: str = None) -> bytes:
    import weasyprint
    from weasyprint.fonts import FontConfiguration

    font_config = FontConfiguration()

    return weasyprint.HTML(string=html).write_pdf(font_config=font_config)


def lettergce_pdf_response(pdf_bytes: bytes) -> FileResponse:
    """
    Creates a FileResponse for the given PDF bytes and an
    appropriate filename for the GCE letter.
    """

    return FileResponse(BytesIO(pdf_bytes), filename=f"good-cause-letter.pdf")


def email_letter_to_user(letter: LetterGCE, pdf_bytes: bytes):
    ud = letter.landlord_details
    assert ud.email

    if is_not_demo_deployment(f"emailing {letter} to user"):
        email = Email(
            subject="test gce letter email",
            body=html_to_text(letter.html_content),
            html_body=letter.html_content,
        )
        attachment = lettergce_pdf_response(pdf_bytes)
        email_file_response_as_attachment(
            subject=email.subject,
            body=email.body,
            html_body=email.html_body,
            recipients=[ud.email],
            attachment=attachment,
        )

    return True


def email_letter_to_landlord(letter: LetterGCE, pdf_bytes: bytes):
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
        attachment = lettergce_pdf_response(pdf_bytes)
        email_file_response_as_attachment(
            subject=email.subject,
            body=email.body,
            html_body=email.html_body,
            recipients=[ld.email],
            attachment=attachment,
        )

    letter.letter_emailed_at = timezone.now()
    letter.save()
    return True


def send_letter_via_lob(letter: LetterGCE, pdf_bytes: bytes, letter_description: str) -> bool:
    """
    Mails the letter to the user's landlord via Lob. Does
    nothing if the letter has already been sent.

    Returns True if the letter was just sent.
    """

    if letter.letter_sent_at is not None:
        logger.info(f"{letter} has already been mailed to the landlord.")
        return False

    response = send_pdf_to_landlord_via_lob(letter, pdf_bytes, letter_description)

    letter.lob_letter_object = response
    letter.tracking_number = response["tracking_number"]
    letter.letter_sent_at = timezone.now()
    letter.save()

    ud = letter.user_details
    twilio.send_sms_async(
        ud.phone_number,
        f"Hi {ud.first_name}, your gce letter has been mailed:\n"
        + f"{USPS_TRACKING_URL_PREFIX + letter.tracking_number}",
    )

    return True


def send_pdf_to_landlord_via_lob(
    letter: LetterGCE, pdf_bytes: bytes, description: str
) -> Dict[str, Any]:
    """
    Mail the given PDF to the given user's landlord using USPS certified
    mail, via Lob.  Assumes that the user has a landlord with a mailing
    address.

    Returns the response from the Lob API.
    """

    ud = letter.user_details
    ld = letter.landlord_details
    assert ld.address_lines_for_mailing
    landlord_verification = lob_api.verify_address(**ld.as_lob_params())
    user_verification = lob_api.verify_address(**ud.as_lob_params())

    logger.info(
        f"Sending {description} to landlord with {landlord_verification['deliverability']} "
        f"landlord address."
    )

    return lob_api.mail_certified_letter(
        description=description,
        to_address={
            "name": ld.name,
            **lob_api.verification_to_inline_address(landlord_verification),
        },
        from_address={
            "name": ud.full_name,
            **lob_api.verification_to_inline_address(user_verification),
        },
        file=BytesIO(pdf_bytes),
        color=False,
        double_sided=False,
    )


def send_letter(letter: LetterGCE):
    ud = letter.user_details
    ld = letter.landlord_details

    pdf_bytes = render_pdf_bytes(letter.html_content)

    if ld.email and letter.email_to_landlord:
        email_letter_to_landlord(letter, pdf_bytes)

    if ld.address_lines_for_mailing and letter.will_we_mail and LETTER_SENDING_ENABLED:
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
