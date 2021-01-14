from io import BytesIO
from django.http.response import FileResponse
from django.utils.translation import get_language

from .hardship_declaration import fill_hardship_pdf, EXAMPLE_VARIABLES


def render_example_declaration_pdf(request):
    locale = get_language()
    b = fill_hardship_pdf(EXAMPLE_VARIABLES, locale)
    return FileResponse(BytesIO(b), filename="example-declaration.pdf")
