from typing import List
from io import BytesIO
import logging
from django.http import FileResponse
from django.utils import timezone
from django.utils.translation import gettext as _
from django.db import transaction


from project import slack, locales
from project.util.letter_sending import (
    USPS_TRACKING_URL_PREFIX,
    render_multilingual_letter,
    send_letter_via_lob,
)
from project.util.site_util import SITE_CHOICES
from project.util.demo_deployment import is_not_demo_deployment
from frontend.static_content import (
    react_render,
    email_react_rendered_content_with_attachment,
    ContentType,
)
from users.models import JustfixUser
from . import models


# The URL, relative to the localized site root, that renders the NoRent
# letter PDF.
NORENT_LETTER_PDF_URL = "letter.pdf"

# The URL, relative to the localized site root, that renders the NoRent
# email to the landlord.
NORENT_EMAIL_TO_LANDLORD_URL = "letter-email.txt"

# The URL, relative to the localized site root, that renders the NoRent
# email to the user.
NORENT_EMAIL_TO_USER_URL = "letter-email-to-user.html"

USER_CONFIRMATION_TEXT = "%(name)s you've sent your letter of non-payment of rent. You can track the delivery of your letter using USPS Tracking: %(url)s."

logger = logging.getLogger(__name__)


def norent_pdf_response(pdf_bytes: bytes) -> FileResponse:
    """
    Creates a FileResponse for the given PDF bytes and an
    appropriate filename for the NoRent letter.
    """

    return FileResponse(BytesIO(pdf_bytes), filename="norent-letter.pdf")


def email_letter_to_landlord(letter: models.Letter, pdf_bytes: bytes) -> bool:
    """
    Email the given letter to the user's landlord. Does nothing if the
    letter has already been emailed.

    Returns True if the email was just sent.
    """

    if letter.letter_emailed_at is not None:
        logger.info(f"{letter} has already been emailed to the landlord.")
        return False
    ld = letter.user.landlord_details
    assert ld.email

    if is_not_demo_deployment(f"emailing {letter} to landlord"):
        email_react_rendered_content_with_attachment(
            SITE_CHOICES.NORENT,
            letter.user,
            NORENT_EMAIL_TO_LANDLORD_URL,
            recipients=[ld.email],
            attachment=norent_pdf_response(pdf_bytes),
            # Force the locale of this email to English, since that's what the
            # landlord will read the email as.
            locale=locales.DEFAULT,
        )

    letter.letter_emailed_at = timezone.now()
    letter.save()
    return True


def create_letter(user: JustfixUser, rps: List[models.RentPeriod]) -> models.Letter:
    """
    Create a Letter model and set its PDF HTML content.
    """

    html_content = react_render(
        SITE_CHOICES.NORENT,
        locales.DEFAULT,
        NORENT_LETTER_PDF_URL,
        ContentType.PDF,
        user=user,
    ).html

    localized_html_content = ""
    if user.locale != locales.DEFAULT:
        localized_html_content = react_render(
            SITE_CHOICES.NORENT, user.locale, NORENT_LETTER_PDF_URL, ContentType.PDF, user=user
        ).html

    with transaction.atomic():
        letter = models.Letter(
            user=user,
            locale=user.locale,
            html_content=html_content,
            localized_html_content=localized_html_content,
        )
        letter.full_clean()
        letter.save()
        letter.rent_periods.set(rps)

    return letter


def send_letter(letter: models.Letter):
    """
    Send the given letter using whatever information is populated
    in their landlord details: that is, if we have the landlord's
    email, then send an email of the letter, and if we have
    the landlord's mailing address, then send a physical copy
    of the letter.

    If any part of the sending fails, this function can be called
    again and it won't send multiple copies of the letter.
    """

    pdf_bytes = render_multilingual_letter(letter)
    user = letter.user
    ld = user.landlord_details

    if ld.email:
        email_letter_to_landlord(letter, pdf_bytes)

    if ld.address_lines_for_mailing:
        send_letter_via_lob(
            letter,
            pdf_bytes,
            sms_text=USER_CONFIRMATION_TEXT,
            letter_description="No rent letter",
        )

    if user.email:
        email_react_rendered_content_with_attachment(
            SITE_CHOICES.NORENT,
            user,
            NORENT_EMAIL_TO_USER_URL,
            is_html_email=True,
            recipients=[user.email],
            attachment=norent_pdf_response(pdf_bytes),
            # Use the user's preferred locale, since they will be the one
            # reading it.
            locale=user.locale,
        )

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
        f"has sent a no rent letter!",
        is_safe=True,
    )

    letter.fully_processed_at = timezone.now()
    letter.save()


def create_and_send_letter(user: JustfixUser, rps: List[models.RentPeriod]):
    """
    Create a Letter model and send it.
    """

    letter = create_letter(user, rps)
    send_letter(letter)
