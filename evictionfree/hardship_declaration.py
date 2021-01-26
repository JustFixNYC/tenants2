from typing import List, Optional
from pathlib import Path
from pydantic import BaseModel

from .overlay_pdf import Text, Page, Document


PDF_DIR = Path(__file__).parent.resolve() / "pdf"


class HardshipDeclarationVariables(BaseModel):
    index_number: Optional[str]
    county_and_court: Optional[str]
    address: str
    has_financial_hardship: bool
    has_health_risk: bool
    name: str
    date: str


EXAMPLE_VARIABLES = HardshipDeclarationVariables(
    address="654 Park Place, Brooklyn NY 11216",
    index_number="123456",
    county_and_court="Kings County",
    has_financial_hardship=True,
    has_health_risk=True,
    name="Boop Jones",
    date="1/1/2021",
)


def _pages_en(v: HardshipDeclarationVariables) -> List[Page]:
    return [
        # First page has nothing to be filled out.
        Page(),
        Page(
            form_fields={
                "Index Number 2": v.index_number,
                "County and Court 2": v.county_and_court,
                "Text Field 4": v.address,
                "Check Box 1": v.has_financial_hardship,
            },
        ),
        Page(
            form_fields={
                "Check Box 2": v.has_health_risk,
                "Text Field 3": v.name,
                "Text Field 2": v.date,
            },
            items=[
                # Signature
                Text(v.name, 290, 540),
            ],
        ),
    ]


def _pages_es(v: HardshipDeclarationVariables) -> List[Page]:
    return [
        # First page has nothing to be filled out.
        Page(),
        Page(
            form_fields={
                "Index Number 3": v.index_number,
                "County and Court 3": v.county_and_court,
                "Text Field 4": v.address,
                "Check Box 1": v.has_financial_hardship,
            },
        ),
        Page(
            form_fields={
                "Check Box 2": v.has_health_risk,
                "Text Field 3": v.name,
                "Text Field 2": v.date,
            },
            items=[
                # Signature
                Text(v.name, 300, 524),
            ],
        ),
    ]


def get_pages(v: HardshipDeclarationVariables, locale: str) -> List[Page]:
    if locale == "en":
        return _pages_en(v)
    elif locale == "es":
        return _pages_es(v)
    raise NotImplementedError(f"Unimplemented locale: {locale}")


def fill_hardship_pdf(v: HardshipDeclarationVariables, locale: str) -> bytes:
    path = PDF_DIR / f"hardship-declaration-{locale}.pdf"
    assert path.exists()
    overlay = Document(pages=get_pages(v, locale))
    return overlay.overlay_atop(path).getvalue()
