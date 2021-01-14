from typing import Optional
from pathlib import Path
from pydantic import BaseModel

from .overlay_pdf import Text, Checkbox, Page, Document


PDF_DIR = Path(__file__).parent.resolve() / "pdf"


class HardshipDeclarationVariables(BaseModel):
    index_number: Optional[str]
    county_and_court: Optional[str]
    address: str
    has_financial_hardship: bool
    has_health_risk: bool
    name: str
    date: str


def fill_hardship_pdf(v: HardshipDeclarationVariables, locale: str) -> bytes:
    path = PDF_DIR / f"hardship-declaration-{locale}.pdf"
    assert path.exists()
    overlay = Document(
        pages=[
            # First page has nothing to be filled out.
            Page(items=[]),
            Page(
                items=[
                    Text(v.index_number or "", 288, 128),
                    Text(v.county_and_court or "", 310, 160),
                    Text(v.address, 75, 324),
                    Checkbox(v.has_financial_hardship, 91, 410),
                ]
            ),
            Page(
                items=[
                    Checkbox(v.has_health_risk, 91, 255),
                    # Signature
                    Text(v.name, 290, 540),
                    # Printed name
                    Text(v.name, 290, 579),
                    Text(v.date, 290, 620),
                ]
            ),
        ]
    )
    return overlay.overlay_atop(path).getvalue()


if __name__ == "__main__":
    b = fill_hardship_pdf(
        HardshipDeclarationVariables(
            address="654 Park Place, Brooklyn NY 11216",
            index_number="123456",
            county_and_court="Kings County",
            has_financial_hardship=True,
            has_health_risk=True,
            name="Boop Jones",
            date="January 1, 2021",
        ),
        "en",
    )
    Path("filled-declaration.pdf").write_bytes(b)
