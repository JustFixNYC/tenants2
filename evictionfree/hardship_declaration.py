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

# The latest PDF version of the Hardship Declaration to use when
# rendering brand-new declarations (i.e., ones that were just signed).
LATEST_PDF_VERSION = 3


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

    # Note we want this to default to '1' so that old instances of this
    # object we're pulling from the DB have it set to a value that's
    # accurate for them. That is, it is intentionally *not* defaulting to
    # `LATEST_PDF_VERSION`.
    pdf_version: int = 1


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
                Text(v.name, 290, 558),
                # Printed name
                Text(v.name, 290, 589),
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
    path = PDF_DIR / f"hardship-declaration-v{v.pdf_version}-{locale}.pdf"
    assert path.exists()
    overlay = Document(pages=get_pages(v, locale))
    return overlay.overlay_atop(path).getvalue()


def _get_county_and_court_for_user(user: JustfixUser) -> Optional[str]:
    parts: List[str] = []
    hdd = user.hardship_declaration_details
    county = user.onboarding_info.lookup_county()

    if hdd.court_name:
        parts.append(hdd.court_name)

    if county:
        parts.append(f"{county} County")

    if parts:
        return ", ".join(parts)

    hci = get_housing_court_info_for_user(user)
    return hci and hci.name


def get_vars_for_user(user: JustfixUser) -> Optional[HardshipDeclarationVariables]:
    """
    Return the hardship declaration variables for the given user, assuming
    that they want to fill it out and sign the latest version of it
    right now.
    """

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
        county_and_court=_get_county_and_court_for_user(user),
        address=", ".join(onb.address_lines_for_mailing),
        has_financial_hardship=hdd.has_financial_hardship,
        has_health_risk=hdd.has_health_risk,
        name=user.full_legal_name,
        date=date.today().strftime("%m/%d/%Y"),
        pdf_version=LATEST_PDF_VERSION,
    )
