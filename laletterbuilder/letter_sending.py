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


# The URL, relative to the localized site root, that renders the LA Letter builder
# letter PDF.
LALETTERBUILDER_LETTER_PDF_URL = "letter.pdf"

# The URL, relative to the localized site root, that renders the LA Letter builder
# email to the landlord.
LALETTERBUILDER_EMAIL_TO_LANDLORD_URL = "letter-email.txt"

# The URL, relative to the localized site root, that renders the LA Letter builder
# email to the user.
LALETTERBUILDER_EMAIL_TO_USER_URL = "letter-email-to-user.html"

logger = logging.getLogger(__name__)


def laletterbuilder_pdf_response(pdf_bytes: bytes, letter_type: str) -> FileResponse:
    """
    Creates a FileResponse for the given PDF bytes and an
    appropriate filename for the LA letter.
    """

    return FileResponse(BytesIO(pdf_bytes), filename=f"{letter_type}-letter.pdf")


def email_letter_to_landlord(letter: models.Letter, pdf_bytes: bytes):
    if letter.letter_emailed_at is not None:
        logger.info(f"{letter} has already been emailed to the landlord.")
        return False
    ld = letter.user.landlord_details
    assert ld.email

    if is_not_demo_deployment(f"emailing {letter} to landlord"):
        letter_type = letter.get_letter_type()
        email_react_rendered_content_with_attachment(
            SITE_CHOICES.LALETTERBUILDER,
            letter.user,
            LALETTERBUILDER_EMAIL_TO_LANDLORD_URL,
            recipients=[ld.email],
            attachment=laletterbuilder_pdf_response(pdf_bytes, letter_type),
            # Force the locale of this email to English, since that's what the
            # landlord will read the email as.
            locale=locales.DEFAULT,
        )

    letter.letter_emailed_at = timezone.now()
    letter.save()
    return True


def create_letter(user: JustfixUser) -> models.Letter:
    """
    Create a blank Letter model. HTML content is required but it will be trivial until
    the user sends the letter.
    """

    with transaction.atomic():
        # TODO: Make this work for any type of letter
        letter = models.HabitabilityLetter(
            user=user,
            locale=user.locale,
            html_content="<>",
        )
        letter.full_clean()
        letter.save()

    return letter


def send_letter(letter: models.Letter):
    user = letter.user

    html_content = react_render(
        SITE_CHOICES.LALETTERBUILDER,
        locales.DEFAULT,
        LALETTERBUILDER_LETTER_PDF_URL,
        ContentType.PDF,
        user=user,
    ).html

    localized_html_content = ""
    if user.locale != locales.DEFAULT:
        localized_html_content = react_render(
            SITE_CHOICES.LALETTERBUILDER,
            user.locale,
            LALETTERBUILDER_LETTER_PDF_URL,
            ContentType.PDF,
            user=user,
        ).html

    pdf_bytes = render_multilingual_letter(letter)
    letter_type = letter.get_letter_type()  # TODO: localize this somewhere
    ld = user.landlord_details

    # TODO: fill in user pref
    if ld.email:
        email_letter_to_landlord(letter, pdf_bytes)

    if ld.address_lines_for_mailing:
        send_letter_via_lob(
            letter,
            pdf_bytes,
            letter_description=f"{letter_type} letter",
        )

    if user.email:
        pass
        # TODO: add letter-email-to-user page on the front end
        # email_react_rendered_content_with_attachment(
        #     SITE_CHOICES.LALETTERBUILDER,
        #     user,
        #     LALETTERBUILDER_EMAIL_TO_USER_URL,
        #     is_html_email=True,
        #     recipients=[user.email],
        #     attachment=laletterbuilder_pdf_response(pdf_bytes, letter_type),
        #     # Use the user's preferred locale, since they will be the one
        #     # reading it.
        #     locale=user.locale,
        # )

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
        f"has sent a {letter_type} letter!",
        is_safe=True,
    )

    with transaction.atomic():
        letter.html_content = html_content
        letter.localized_html_content = localized_html_content
        letter.fully_processed_at = timezone.now()
        letter.full_clean()
        letter.save()
