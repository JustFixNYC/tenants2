from datetime import date
from typing import List, Optional
from pathlib import Path
from users.models import JustfixUser
from pydantic import BaseModel
import graphene

from .housing_court import get_housing_court_info_for_user
from .overlay_pdf import Text, Checkbox, Page, Document


PDF_DIR = Path(__file__).parent.resolve() / "pdf"

# What we call the declaration when we give it to users.
PDF_NAME = "hardship-declaration.pdf"


class GraphQLHardshipDeclarationVariables(graphene.ObjectType):
    index_number = graphene.String()
    county_and_court = graphene.String()
    address = graphene.String(required=True)
    has_financial_hardship = graphene.Boolean(required=True)
    has_health_risk = graphene.Boolean(required=True)
    name = graphene.String(required=True)
    date = graphene.String(required=True)


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
        Page(items=[]),
        Page(
            items=[
                Text(v.index_number, 288, 128),
                Text(v.county_and_court, 310, 160),
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


def _pages_es(v: HardshipDeclarationVariables) -> List[Page]:
    return [
        # First page has nothing to be filled out.
        Page(items=[]),
        Page(
            items=[
                Text(v.index_number, 344, 128),
                Text(v.county_and_court, 353, 160),
                Text(v.address, 65, 324),
                Checkbox(v.has_financial_hardship, 79, 413),
            ]
        ),
        Page(
            items=[
                Checkbox(v.has_health_risk, 80, 256),
                # Signature
                Text(v.name, 300, 524),
                # Printed name
                Text(v.name, 300, 564),
                Text(v.date, 300, 604),
            ]
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


def get_vars_for_user(user: JustfixUser) -> Optional[HardshipDeclarationVariables]:
    if not (
        user.is_authenticated
        and hasattr(user, "hardship_declaration_details")
        and hasattr(user, "onboarding_info")
    ):
        return None
    hdd = user.hardship_declaration_details
    onb = user.onboarding_info
    hci = get_housing_court_info_for_user(user)
    return HardshipDeclarationVariables(
        index_number=hdd.index_number or None,
        county_and_court=hci and hci.name,
        address=", ".join(onb.address_lines_for_mailing),
        has_financial_hardship=hdd.has_financial_hardship,
        has_health_risk=hdd.has_health_risk,
        name=user.full_name,
        date=date.today().strftime("%m/%d/%Y"),
    )
