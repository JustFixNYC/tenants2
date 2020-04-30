from io import BytesIO
import logging
from django.http import FileResponse
from django.conf import settings
from django.urls import reverse
from django.utils import timezone

from project import slack
from project.util.email_attachment import email_file_response_as_attachment
from project.util.html_to_text import html_to_text
from loc.views import render_pdf_bytes
from loc import lob_api
from . import models


logger = logging.getLogger(__name__)


def send_letter(request, rp: models.RentPeriod):
    from project.views import render_raw_lambda_static_content

    user = request.user

    # TODO: Once we translate to other languages, we'll likely want to
    # force the locale of this letter to English, since that's what the
    # landlord will read the letter as.
    lr = render_raw_lambda_static_content(
        request,
        url=f"{reverse('react')}letter.pdf"
    )
    assert lr is not None, "Rendering of PDF HTML must succeed"
    assert lr.http_headers['Content-Type'] == "application/pdf"
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
        lr = render_raw_lambda_static_content(
            request,
            url=f"{reverse('react')}letter-email.txt"
        )
        assert lr is not None, "Rendering of email text must succeed"
        assert lr.http_headers['Content-Type'] == "text/plain; charset=utf-8"
        email_file_response_as_attachment(
            subject=lr.http_headers['X-JustFix-Email-Subject'],
            body=html_to_text(lr.html),
            recipients=[ld.email],
            attachment=FileResponse(BytesIO(pdf_bytes), filename="letter.pdf"),
        )
        letter.letter_emailed_at = timezone.now()
        letter.save()

    if ld.address_lines_for_mailing:
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

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
        f"has sent a no rent letter!",
        is_safe=True
    )
