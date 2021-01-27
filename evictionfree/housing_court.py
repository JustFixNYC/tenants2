from typing import NamedTuple, Optional
from users.models import JustfixUser

from onboarding.models import BOROUGH_CHOICES

BOROUGH_EMAILS = {
    BOROUGH_CHOICES.BRONX: "BronxHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.BROOKLYN: "KingsHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.MANHATTAN: "NewYorkHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.QUEENS: "QueensHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.STATEN_ISLAND: "RichmondHardshipDeclaration@nycourts.gov",
}

BOROUGH_COURT_NAMES = {
    BOROUGH_CHOICES.BRONX: "Bronx County Housing Court",
    BOROUGH_CHOICES.BROOKLYN: "Kings County Housing Court",
    BOROUGH_CHOICES.MANHATTAN: "New York County Housing Court",
    BOROUGH_CHOICES.QUEENS: "Queens County Housing Court",
    BOROUGH_CHOICES.STATEN_ISLAND: "Richmond County Housing Court",
}


class HousingCourtInfo(NamedTuple):
    name: str
    email: str


def get_housing_court_info_for_user(user: JustfixUser) -> Optional[HousingCourtInfo]:
    if not hasattr(user, "onboarding_info"):
        return None

    oi = user.onboarding_info

    if oi.borough:
        return HousingCourtInfo(
            name=BOROUGH_COURT_NAMES[oi.borough], email=BOROUGH_EMAILS[oi.borough]
        )

    # TODO: Need to figure out what email to send this to!

    return None
