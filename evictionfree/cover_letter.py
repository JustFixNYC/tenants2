from datetime import date
from typing import List, Optional
from pydantic import BaseModel
from django.template.loader import render_to_string

from users.models import JustfixUser
from evictionfree.housing_court_email import get_housing_court_email_for_user


class CoverLetterVariables(BaseModel):
    date: str
    landlord_name: str
    landlord_address: Optional[str]
    landlord_email: Optional[str]
    housing_court_email: Optional[str]


def get_vars_for_user(user: JustfixUser) -> Optional[CoverLetterVariables]:
    if not hasattr(user, "landlord_details"):
        return None

    ld = user.landlord_details

    if not ld.name:
        return None

    return CoverLetterVariables(
        date=date.today().strftime("%m/%d/%Y"),
        landlord_name=ld.name,
        landlord_address=", ".join(ld.address_lines_for_mailing) or None,
        landlord_email=ld.email or None,
        housing_court_email=get_housing_court_email_for_user(user),
    )


def render_cover_letter_html(v: CoverLetterVariables) -> str:
    recipients: List[str] = []

    if v.landlord_address:
        recipients.append(
            f"Landlord: {v.landlord_name}, via USPS Certified Mail to {v.landlord_address}"
        )
    if v.landlord_email:
        recipients.append(f"Landlord: {v.landlord_name}, via email to {v.landlord_email}")
    if v.housing_court_email:
        recipients.append(f"Housing Court, via email to {v.housing_court_email}")

    return render_to_string(
        "evictionfree/cover-letter.html",
        {"date": v.date, "recipients": recipients},
    )
