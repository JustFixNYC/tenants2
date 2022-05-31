from typing import Any, Dict, List
from project import common_data
from project.util import lob_api
import logging
from loc.views import render_pdf_bytes
import PyPDF2
from users.models import JustfixUser
from io import BytesIO
from project.util.lob_models_util import LocalizedHTMLLetter
from django.utils import timezone
from django.utils.translation import gettext as _


logger = logging.getLogger(__name__)


# The URL prefix for USPS certified letter tracking.
USPS_TRACKING_URL_PREFIX = common_data.load_json("loc.json")["USPS_TRACKING_URL_PREFIX"]


def send_pdf_to_landlord_via_lob(
    user: JustfixUser, pdf_bytes: bytes, description: str
) -> Dict[str, Any]:
    """
    Mail the given PDF to the given user's landlord using USPS certified
    mail, via Lob.  Assumes that the user has a landlord with a mailing
    address.

    Returns the response from the Lob API.
    """

    ld = user.landlord_details
    assert ld.address_lines_for_mailing
    ll_addr_details = ld.get_or_create_address_details_model()
    landlord_verification = lob_api.verify_address(**ll_addr_details.as_lob_params())
    user_verification = lob_api.verify_address(**user.onboarding_info.as_lob_params())

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
            "name": user.full_legal_name,
            **lob_api.verification_to_inline_address(user_verification),
        },
        file=BytesIO(pdf_bytes),
        color=False,
        double_sided=False,
    )


def _merge_pdfs(pdfs: List[bytes]) -> bytes:
    merger = PyPDF2.PdfFileMerger()
    for pdf_bytes in pdfs:
        merger.append(PyPDF2.PdfFileReader(BytesIO(pdf_bytes)))
    outfile = BytesIO()
    merger.write(outfile)
    return outfile.getvalue()


def render_multilingual_letter(letter: LocalizedHTMLLetter) -> bytes:
    pdf_bytes = render_pdf_bytes(letter.html_content)
    if letter.localized_html_content:
        localized_pdf_bytes = render_pdf_bytes(letter.localized_html_content)
        pdf_bytes = _merge_pdfs([pdf_bytes, localized_pdf_bytes])
    return pdf_bytes


def send_letter_via_lob(
    letter: LocalizedHTMLLetter, pdf_bytes: bytes, letter_description: str, sms_text: str = None
) -> bool:
    """
    Mails the letter to the user's landlord via Lob. Does
    nothing if the letter has already been sent.

    Returns True if the letter was just sent.
    """

    if letter.letter_sent_at is not None:
        logger.info(f"{letter} has already been mailed to the landlord.")
        return False

    user = letter.user

    response = send_pdf_to_landlord_via_lob(user, pdf_bytes, letter_description)

    letter.lob_letter_object = response
    letter.tracking_number = response["tracking_number"]
    letter.letter_sent_at = timezone.now()
    letter.save()

    if sms_text:
        user.send_sms_async(
            _(sms_text)
            % {
                "name": user.full_legal_name,
                "url": USPS_TRACKING_URL_PREFIX + letter.tracking_number,
            }
        )

    return True


def does_user_have_ll_mailing_addr_or_email(user) -> bool:
    return hasattr(user, "landlord_details") and (
        user.landlord_details.address_lines_for_mailing or user.landlord_details.email
    )
