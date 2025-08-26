import base64
from project.util.demo_deployment import is_not_demo_deployment
from project.util.letter_sending import (
    render_multilingual_letter,
    send_letter_via_lob,
)
from . import models
from io import BytesIO
import logging
from django.http import FileResponse
from django.utils import timezone
from django.db import transaction

from users.models import JustfixUser
from frontend.static_content import (
    react_render,
    email_react_rendered_content_with_attachment,
    ContentType,
)
from project.util.site_util import SITE_CHOICES
from project import slack, locales

from lettersender.models import LA_MAILING_CHOICES

# URL patterns for the letter builder
LETTERSENDER_LETTER_PDF_URL = "letter.pdf"
LETTERSENDER_LETTER_HTML_URL = "letter.html"
LETTERSENDER_LETTER_EMAIL_URL = "letter-email.txt"
LETTERSENDER_EMAIL_TO_LANDLORD_URL = "letter-email.txt"
LETTERSENDER_EMAIL_TO_USER_URL = "letter-email-to-user.html"

# Email templates
LETTERSENDER_EMAIL_SUBJECT = "Your Letter Sender Letter"
LETTERSENDER_EMAIL_BODY = "Please find your letter attached."

# Set to true when we are ready to test LOB letter sending
LETTER_SENDING_ENABLED = True


def lettersender_pdf_response(pdf_bytes: bytes, letter_type: str) -> FileResponse:
    """
    Create a PDF response for the letter.
    """
    return FileResponse(BytesIO(pdf_bytes), filename=f"{letter_type}-letter.pdf")


def email_letter_to_landlord(letter: models.LetterSenderLetter, pdf_bytes: bytes):
    if letter.letter_emailed_at is not None:
        logging.info(f"{letter} has already been emailed to the landlord.")
        return False
    ld = letter.user.landlord_details
    assert ld.email

    if is_not_demo_deployment(f"emailing {letter} to landlord"):
        letter_type = letter.get_letter_type()
        email_react_rendered_content_with_attachment(
            SITE_CHOICES.LETTERSENDER,
            letter.user,
            LETTERSENDER_EMAIL_TO_LANDLORD_URL,
            recipients=[ld.email],
            attachment=lettersender_pdf_response(pdf_bytes, letter_type),
            # Force the locale of this email to English, since that's what the
            # landlord will read the email as.
            locale=locales.DEFAULT,
        )

    letter.letter_emailed_at = timezone.now()
    letter.save()
    return True


def email_letter_to_user(letter: models.LetterSenderLetter, pdf_bytes: bytes):
    if is_not_demo_deployment(f"emailing {letter} to user"):
        letter_type = letter.get_letter_type()
        email_react_rendered_content_with_attachment(
            SITE_CHOICES.LETTERSENDER,
            letter.user,
            LETTERSENDER_EMAIL_TO_USER_URL,
            is_html_email=True,
            recipients=[letter.user.email],
            attachment=lettersender_pdf_response(pdf_bytes, letter_type),
            # Use the user's preferred locale, since they will be the one
            # reading it.
            locale=letter.user.locale,
        )
    return True


def create_letter(user: JustfixUser) -> models.LetterSenderLetter:
    """
    Create a blank Letter model. HTML content is required but it will be trivial until
    the user sends the letter.
    """

    with transaction.atomic():
        # TODO: Make this work for any type of letter
        letter = models.LetterSenderLetter(
            user=user,
            locale=user.locale,
            html_content="<>",
        )
        letter.full_clean()
        letter.save()

    return letter


def send_letter(letter: models.LetterSenderLetter):
    user = letter.user

    html_content = react_render(
        SITE_CHOICES.LETTERSENDER,
        locales.DEFAULT,
        LETTERSENDER_LETTER_PDF_URL,
        ContentType.PDF,
        user=user,
    ).html

    localized_html_content = ""
    if user.locale != locales.DEFAULT:
        localized_html_content = react_render(
            SITE_CHOICES.LETTERSENDER,
            user.locale,
            LETTERSENDER_LETTER_PDF_URL,
            ContentType.PDF,
            user=user,
        ).html

    with transaction.atomic():
        letter.html_content = html_content
        letter.localized_html_content = localized_html_content
        letter.save()

    pdf_bytes = render_multilingual_letter(letter)
    letter_type = letter.get_letter_type()  # TODO: localize this somewhere
    ld = user.landlord_details

    if ld.email and letter.email_to_landlord:
        email_letter_to_landlord(letter, pdf_bytes)

    if (
        ld.address_lines_for_mailing
        and letter.mail_choice == LA_MAILING_CHOICES.WE_WILL_MAIL
        and LETTER_SENDING_ENABLED
    ):
        send_letter_via_lob(
            letter,
            pdf_bytes,
            letter_description=f"{letter_type} letter",
        )

    if user.email:
        email_letter_to_user(letter, pdf_bytes)

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
        f"has sent a {letter_type} letter!",
        is_safe=True,
    )

    with transaction.atomic():
        letter.pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
        letter.fully_processed_at = timezone.now()
        letter.full_clean()
        letter.save()
