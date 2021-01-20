from io import BytesIO
from datetime import date
from typing import Optional
from django.http.response import FileResponse, Http404
from django.utils.translation import get_language

from users.models import JustfixUser
from .hardship_declaration import fill_hardship_pdf, EXAMPLE_VARIABLES, HardshipDeclarationVariables


def _render_pdf(v: HardshipDeclarationVariables, filename: str):
    locale = get_language()
    b = fill_hardship_pdf(v, locale)
    return FileResponse(BytesIO(b), filename=filename)


def render_example_declaration_pdf(request):
    return _render_pdf(EXAMPLE_VARIABLES, "example-declaration.pdf")


def _get_vars_for_user(user: JustfixUser) -> Optional[HardshipDeclarationVariables]:
    if not (
        user.is_authenticated
        and hasattr(user, "hardship_declaration_details")
        and hasattr(user, "onboarding_info")
    ):
        return None
    hdd = user.hardship_declaration_details
    onb = user.onboarding_info
    return HardshipDeclarationVariables(
        index_number=hdd.index_number or None,
        county_and_court=None,
        address=", ".join(onb.address_lines_for_mailing),
        has_financial_hardship=hdd.has_financial_hardship,
        has_health_risk=hdd.has_health_risk,
        name=user.full_name,
        date=date.today().strftime("%m/%d/%Y"),
    )


def render_preview_declaration_pdf_for_user(request):
    v = _get_vars_for_user(request.user)
    if v is None:
        raise Http404()
    return _render_pdf(v, "preview-declaration.pdf")
