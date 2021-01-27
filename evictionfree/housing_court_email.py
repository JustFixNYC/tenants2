from typing import Optional
from users.models import JustfixUser

from onboarding.models import BOROUGH_CHOICES

BOROUGH_EMAILS = {
    BOROUGH_CHOICES.BRONX: "BronxHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.BROOKLYN: "KingsHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.MANHATTAN: "NewYorkHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.QUEENS: "QueensHardshipDeclaration@nycourts.gov",
    BOROUGH_CHOICES.STATEN_ISLAND: "RichmondHardshipDeclaration@nycourts.gov",
}


def get_housing_court_email_for_user(user: JustfixUser) -> Optional[str]:
    if not hasattr(user, "onboarding_info"):
        return None

    oi = user.onboarding_info

    if oi.borough:
        return BOROUGH_EMAILS[oi.borough]

    # TODO: Need to figure out what email to send this to!

    return None
