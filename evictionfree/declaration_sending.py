from evictionfree.housing_court import get_housing_court_info_for_user
import logging
from django.conf import settings
from django.utils import timezone

from evictionfree.models import SubmittedHardshipDeclaration
from users.models import JustfixUser
from project import slack
from . import hardship_declaration, cover_letter


logger = logging.getLogger(__name__)


def create_declaration(user: JustfixUser) -> SubmittedHardshipDeclaration:
    hd_vars = hardship_declaration.get_vars_for_user(user)
    assert hd_vars is not None
    cl_vars = cover_letter.get_vars_for_user(user)
    assert cl_vars is not None
    shd = SubmittedHardshipDeclaration(
        user=user,
        locale=user.locale,
        cover_letter_html=cover_letter.render_cover_letter_html(cl_vars),
        declaration_variables=hd_vars.dict(),
    )
    shd.full_clean()
    shd.save()
    return shd


def render_declaration(decl: SubmittedHardshipDeclaration) -> bytes:
    from loc.views import render_pdf_bytes
    from norent.letter_sending import _merge_pdfs

    v = hardship_declaration.HardshipDeclarationVariables(**decl.declaration_variables)
    form_pdf_bytes = hardship_declaration.fill_hardship_pdf(v, decl.locale)
    cover_letter_pdf_bytes = render_pdf_bytes(decl.cover_letter_html)
    pdf_bytes = _merge_pdfs([cover_letter_pdf_bytes, form_pdf_bytes])

    return pdf_bytes


def email_declaration_to_landlord(decl: SubmittedHardshipDeclaration, pdf_bytes: bytes) -> bool:
    if settings.IS_DEMO_DEPLOYMENT:
        logger.info(f"Not emailing {decl} because this is a demo deployment.")
        return False

    if decl.emailed_at is not None:
        logger.info(f"{decl} has already been emailed to the landlord.")
        return False

    ld = decl.user.landlord_details
    assert ld.email

    # TODO: Implement this.

    decl.emailed_at = timezone.now()
    decl.save()

    return True


def send_declaration_via_lob(decl: SubmittedHardshipDeclaration, pdf_bytes: bytes) -> bool:
    """
    Mails the declaration to the user's landlord via Lob. Does
    nothing if it has already been sent.

    Returns True if the declaration was just sent.
    """

    if decl.mailed_at is not None:
        logger.info(f"{decl} has already been mailed to the landlord.")
        return False

    # TODO: Implement this, set response to result of lob_api.mail_certified_letter().

    # TODO: Set letter.lob_letter_object to response.

    # TODO: Set tracking number to response["tracking_number"].
    decl.tracking_number = "123456789"

    decl.mailed_at = timezone.now()
    decl.save()

    # TODO: Send SMS informing user of sending and tracking number.
    return True


def send_declaration_to_housing_court(decl: SubmittedHardshipDeclaration, pdf_bytes: bytes) -> bool:
    if decl.emailed_to_housing_court_at is not None:
        logger.info(f"{decl} has already been sent to the housing court.")
        return False

    user = decl.user

    hci = get_housing_court_info_for_user(user)

    if not hci:
        logger.info(f"{decl} has no housing court info, so we can't send it to one.")
        return False

    # TODO: Send the declaration to housing court.

    decl.emailed_to_housing_court_at = timezone.now()
    decl.save()

    return True


def send_declaration(decl: SubmittedHardshipDeclaration):
    """
    Send the given declaration using whatever information is populated
    in the user's landlord details: that is, if we have the landlord's
    email, then send an email of the declaration, and if we have
    the landlord's mailing address, then send a physical copy
    of the declaration.

    This will also send a copy of the declaration to the user's
    housing court, and to the user themselves.

    If any part of the sending fails, this function can be called
    again and it won't send multiple copies of the declaration.
    """

    pdf_bytes = render_declaration(decl)
    user = decl.user
    ld = user.landlord_details

    if ld.email:
        email_declaration_to_landlord(decl, pdf_bytes)

    if ld.address_lines_for_mailing:
        send_declaration_via_lob(decl, pdf_bytes)

    send_declaration_to_housing_court(decl, pdf_bytes)

    if user.email:
        # TODO: Implement this!
        pass

    slack.sendmsg_async(
        f"{slack.hyperlink(text=user.first_name, href=user.admin_url)} "
        f"has sent a hardship declaration!",
        is_safe=True,
    )


def create_and_send_declaration(user: JustfixUser):
    """
    Create a SubmittedHardshipDeclaration model and send it.
    """

    decl = create_declaration(user)
    send_declaration(decl)
