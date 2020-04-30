from typing import List
from io import BytesIO
import logging
from django.http import FileResponse
from django.conf import settings
from django.urls import reverse
from django.utils import timezone

from project import slack
from project.util.email_attachment import email_file_response_as_attachment
from project.util.html_to_text import html_to_text
from project.views import render_raw_lambda_static_content, LambdaResponse
from loc.views import render_pdf_bytes
from loc import lob_api
from . import models


# The URL, relative to the localized site root, that renders the NoRent
# letter PDF.
NORENT_LETTER_PDF_URL = "letter.pdf"

# The URL, relative to the localized site root, that renders the NoRent
# email to the landlord.
NORENT_EMAIL_TO_LANDLORD_URL = "letter-email.txt"


logger = logging.getLogger(__name__)


def render_static_content_via_react(
    request,
    url: str,
    expected_content_type: str,
) -> LambdaResponse:
    '''
    Renders the given front-end URL in a React lambda process,
    automatically prefixing it with the current locale, and
    verifies that it was successful and of the expected
    content type.
    '''

    full_url = f"{reverse('react')}{url}"
    lr = render_raw_lambda_static_content(request, url=full_url)
    assert lr is not None, f"Rendering of {full_url} must succeed"
    content_type = lr.http_headers.get('Content-Type')
    assert content_type == expected_content_type, (
        f"Expected Content-Type of {full_url} to be "
        f"{expected_content_type}, but it is {content_type}"
    )
    return lr


def email_react_rendered_content_with_attachment(
    request,
    url: str,
    recipients: List[str],
    attachment: FileResponse
) -> None:
    '''
    Renders an email in the front-end and sends it to
    the given recipients with the given attachment.
    '''

    lr = render_static_content_via_react(
        request,
        url,
        "text/plain; charset=utf-8"
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


def mail_letter_via_lob(letter: models.Letter, pdf_bytes: bytes) -> None:
    '''
    Mails the NoRent letter via Lob.
    '''

    user = letter.user
    ld = user.landlord_details
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


def send_letter(request, rp: models.RentPeriod):
    user = request.user

    # TODO: Once we translate to other languages, we'll likely want to
    # force the locale of this letter to English, since that's what the
    # landlord will read the letter as.
    lr = render_static_content_via_react(
        request,
        NORENT_LETTER_PDF_URL,
        "application/pdf"
    )
    letter = models.Letter(
        user=user,
        rent_period=rp,
        html_content=lr.html,
    )
    letter.full_clean()
    letter.save()

    pdf_bytes = render_pdf_bytes(letter.html_content)
    ld = user.landlord_details

    if ld.email and not settings.IS_DEMO_DEPLOYMENT:
        email_react_rendered_content_with_attachment(
            request,
            NORENT_EMAIL_TO_LANDLORD_URL,
            recipients=[ld.email],
            attachment=norent_pdf_response(pdf_bytes),
        )
        letter.letter_emailed_at = timezone.now()
        letter.save()

    if ld.address_lines_for_mailing:
        mail_letter_via_lob(letter, pdf_bytes)

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
        f"has sent a no rent letter!",
        is_safe=True
    )
