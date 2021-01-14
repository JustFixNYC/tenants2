from io import BytesIO
from django.http.response import FileResponse
from django.utils.translation import get_language

from .hardship_declaration import HardshipDeclarationVariables, fill_hardship_pdf


def render_example_declaration_pdf(request):
    locale = get_language()
    vars = HardshipDeclarationVariables(
        address="654 Park Place, Brooklyn NY 11216",
        index_number="123456",
        county_and_court="Kings County",
        has_financial_hardship=True,
        has_health_risk=True,
        name="Boop Jones",
        date="1/1/2021",
    )
    b = fill_hardship_pdf(vars, locale)
    return FileResponse(BytesIO(b), filename="example-declaration.pdf")
