from io import BytesIO
from django.http.response import FileResponse, Http404
from django.utils.translation import get_language

from loc.views import pdf_response
from . import hardship_declaration, cover_letter
from .hardship_declaration import HardshipDeclarationVariables


def _render_decl_pdf(v: HardshipDeclarationVariables, filename: str):
    locale = get_language()
    b = hardship_declaration.fill_hardship_pdf(v, locale)
    return FileResponse(BytesIO(b), filename=filename)


def render_example_declaration_pdf(request):
    return _render_decl_pdf(hardship_declaration.EXAMPLE_VARIABLES, "example-declaration.pdf")


def render_preview_cover_letter_for_user(request):
    v = cover_letter.get_vars_for_user(request.user)
    if v is None:
        raise Http404()
    html = cover_letter.render_cover_letter_html(v)
    return pdf_response(html, "preview-cover-letter.pdf")


def render_preview_declaration_pdf_for_user(request):
    v = hardship_declaration.get_vars_for_user(request.user)
    if v is None:
        raise Http404()
    return _render_decl_pdf(v, "preview-declaration.pdf")


def render_submitted_declaration_pdf_for_user(request):
    from evictionfree.declaration_sending import render_declaration

    user = request.user
    if not hasattr(user, "submitted_hardship_declaration"):
        raise Http404()
    b = render_declaration(user.submitted_hardship_declaration)
    return FileResponse(BytesIO(b), filename=hardship_declaration.PDF_NAME)
