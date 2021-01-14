from typing import Optional
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


def fill_hardship_pdf(v: HardshipDeclarationVariables, locale: str) -> bytes:
    path = PDF_DIR / f"hardship-declaration-{locale}.pdf"
    assert path.exists()
    overlay = Document(
        pages=[
            # First page has nothing to be filled out.
            Page(items=[]),
            Page(
                items=[
                    # TODO: Add index number.
                    # TODO: Add county and court.
                    Text(v.address, 75, 324),
                    Text("X" if v.has_financial_hardship else "", 91, 410),
                ]
            ),
            Page(
                items=[
                    Text("X" if v.has_health_risk else "", 91, 255),
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
            has_financial_hardship=True,
            has_health_risk=True,
            name="Boop Jones",
            date="January 1, 2021",
        ),
        "en",
    )
    Path("filled-declaration.pdf").write_bytes(b)
