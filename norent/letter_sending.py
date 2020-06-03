from typing import List
from io import BytesIO
import logging
from django.http import FileResponse
from django.conf import settings
from django.urls import reverse
from django.utils import timezone, translation

from project import slack, locales
from project.util.email_attachment import email_file_response_as_attachment
from project.util.html_to_text import html_to_text
from project.lambda_response import LambdaResponse
from project.util.site_util import get_site_of_type, SITE_CHOICES
from frontend.views import render_raw_lambda_static_content
from users.models import JustfixUser
from loc.views import render_pdf_bytes
from loc import lob_api
from . import models


# The URL, relative to the localized site root, that renders the NoRent
# letter PDF.
NORENT_LETTER_PDF_URL = "letter.pdf"

# The URL, relative to the localized site root, that renders the NoRent
# email to the landlord.
NORENT_EMAIL_TO_LANDLORD_URL = "letter-email.txt"

# The URL, relative to the localized site root, that renders the NoRent
# email to the user.
NORENT_EMAIL_TO_USER_URL = "letter-email-to-user.txt"

logger = logging.getLogger(__name__)


def render_static_content_via_react(
    user: JustfixUser,
    url: str,
    expected_content_type: str,
    locale: str,
) -> LambdaResponse:
    '''
    Renders the given front-end URL in a React lambda process,
    automatically prefixing it with the given locale, and
    verifies that it was successful and of the expected
    content type.
    '''

    with translation.override(locale):
        full_url = f"{reverse('react')}{url}"
        lr = render_raw_lambda_static_content(
            url=full_url,
            site=get_site_of_type(SITE_CHOICES.NORENT),
            user=user,
        )
    assert lr is not None, f"Rendering of {full_url} must succeed"
    content_type = lr.http_headers.get('Content-Type')
    assert content_type == expected_content_type, (
        f"Expected Content-Type of {full_url} to be "
        f"{expected_content_type}, but it is {content_type}"
    )
    return lr


def email_react_rendered_content_with_attachment(
    user: JustfixUser,
    url: str,
    recipients: List[str],
    attachment: FileResponse,
    locale: str,
) -> None:
    '''
    Renders an email in the front-end, using the given locale,
    and sends it to the given recipients with the given attachment.
    '''

    lr = render_static_content_via_react(
        user,
        url,
        "text/plain; charset=utf-8",
        locale=locale
    )
    email_file_response_as_attachment(
        subject=lr.http_headers['X-JustFix-Email-Subject'],
        body=html_to_text(lr.html),
        recipients=recipients,
        attachment=attachment,
    )


def norent_pdf_response(pdf_bytes: bytes) -> FileResponse:
    '''
    Creates a FileResponse for the given PDF bytes and an
    appropriate filename for the NoRent letter.
    '''

    return FileResponse(BytesIO(pdf_bytes), filename="letter.pdf")


def send_letter_via_lob(letter: models.Letter, pdf_bytes: bytes) -> bool:
    '''
    Mails the NoRent letter to the user's landlord via Lob. Does
    nothing if the letter has already been sent.

    Returns True if the letter was just sent.
    '''

    if letter.letter_sent_at is not None:
        logger.info(f"{letter} has already been mailed to the landlord.")
        return False

    user = letter.user
    ld = user.landlord_details
    assert ld.address_lines_for_mailing
    ll_addr_details = ld.get_or_create_address_details_model()
    landlord_verification = lob_api.verify_address(**ll_addr_details.as_lob_params())
    user_verification = lob_api.verify_address(**user.onboarding_info.as_lob_params())

    logger.info(
        f"Sending {letter} with {landlord_verification['deliverability']} "
        f"landlord address."
    )

    response = lob_api.mail_certified_letter(
        description="No rent letter",
        to_address={
            'name': ld.name,
            **lob_api.verification_to_inline_address(landlord_verification),
        },
        from_address={
            'name': user.full_name,
            **lob_api.verification_to_inline_address(user_verification),
        },
        file=BytesIO(pdf_bytes),
        color=False,
        double_sided=False,
    )

    letter.lob_letter_object = response
    letter.tracking_number = response['tracking_number']
    letter.letter_sent_at = timezone.now()
    letter.save()
    return True


def email_letter_to_landlord(letter: models.Letter, pdf_bytes: bytes) -> bool:
    '''
    Email the given letter to the user's landlord. Does nothing if the
    letter has already been emailed.

    Returns True if the email was just sent.
    '''

    if settings.IS_DEMO_DEPLOYMENT:
        logger.info(f"Not emailing {letter} because this is a demo deployment.")
        return False
    if letter.letter_emailed_at is not None:
        logger.info(f"{letter} has already been emailed to the landlord.")
        return False
    ld = letter.user.landlord_details
    assert ld.email

    email_react_rendered_content_with_attachment(
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


def create_letter(user: JustfixUser, rp: models.RentPeriod) -> models.Letter:
    '''
    Create a Letter model and set its PDF HTML content.
    '''

    html_content = render_static_content_via_react(
        user,
        NORENT_LETTER_PDF_URL,
        "application/pdf",
        locale=locales.DEFAULT
    ).html

    localized_html_content = ''
    if user.locale != locales.DEFAULT:
        localized_html_content = render_static_content_via_react(
            user,
            NORENT_LETTER_PDF_URL,
            "application/pdf",
            locale=user.locale
        ).html

    letter = models.Letter(
        user=user,
        locale=user.locale,
        rent_period=rp,
        html_content=html_content,
        localized_html_content=localized_html_content
    )
    letter.full_clean()
    letter.save()
    return letter


def send_letter(letter: models.Letter):
    '''
    Send the given letter using whatever information is populated
    in their landlord details: that is, if we have the landlord's
    email, then send an email of the letter, and if we have
    the landlord's mailing address, then send a physical copy
    of the letter.

    If any part of the sending fails, this function can be called
    again and it won't send multiple copies of the letter.
    '''

    pdf_bytes = render_pdf_bytes(letter.html_content)
    user = letter.user
    ld = user.landlord_details

    if ld.email:
        email_letter_to_landlord(letter, pdf_bytes)

    if ld.address_lines_for_mailing:
        send_letter_via_lob(letter, pdf_bytes)

    if user.email:
        email_react_rendered_content_with_attachment(
            user,
            NORENT_EMAIL_TO_USER_URL,
            recipients=[user.email],
            attachment=norent_pdf_response(pdf_bytes),

            # Use the user's preferred locale, since they will be the one
            # reading it.
            locale=user.locale,
        )

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
        f"has sent a no rent letter!",
        is_safe=True
    )


def create_and_send_letter(user: JustfixUser, rp: models.RentPeriod):
    '''
    Create a Letter model and send it.
    '''

    letter = create_letter(user, rp)
    send_letter(letter)
