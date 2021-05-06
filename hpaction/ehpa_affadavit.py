from pathlib import Path
import pydantic

from users.models import JustfixUser
from onboarding.models import OnboardingInfo
from loc.models import LandlordDetails
from loc.views import (
    pdf_response,
    render_pdf_html,
    render_pdf_bytes,
)
from .build_hpactionvars import fill_landlord_info
from .hpactionvars import HPActionVariables


MY_DIR = Path(__file__).parent.resolve()

MY_TEMPLATES_DIR = MY_DIR / "templates" / "hpaction"

PDF_STYLES_CSS = MY_TEMPLATES_DIR / "ehpa-affadavit.css"

NA = "N/A"


def get_onboarding_info(user) -> OnboardingInfo:
    if hasattr(user, "onboarding_info"):
        return user.onboarding_info
    return OnboardingInfo()


def get_landlord_details(user) -> LandlordDetails:
    if hasattr(user, "landlord_details"):
        return user.landlord_details
    return LandlordDetails()


def get_landlord_address(v: HPActionVariables) -> str:
    street, city, state, zipcode = (
        v.landlord_address_street_te,
        v.landlord_address_city_te,
        v.landlord_address_state_mc,
        v.landlord_address_zip_te,
    )
    if street and city and state and zipcode:
        return f"{street}, {city}, {state.value} {zipcode}"
    return NA


class EHPAAffadavitVars(pydantic.BaseModel):
    tenant_name: str
    tenant_email: str
    tenant_phone: str
    tenant_address: str
    landlord_name: str
    landlord_email: str
    landlord_phone: str
    landlord_address: str

    @classmethod
    def from_user(cls, user: JustfixUser) -> "EHPAAffadavitVars":
        oi = get_onboarding_info(user)
        v = HPActionVariables()
        fill_landlord_info(v, user)
        ld = get_landlord_details(user)
        return EHPAAffadavitVars(
            tenant_name=user.full_legal_name or NA,
            tenant_email=user.email or NA,
            tenant_phone=user.formatted_phone_number() or NA,
            tenant_address=", ".join(oi.address_lines_for_mailing) or NA,
            landlord_name=v.landlord_entity_name_te or NA,
            landlord_email=ld.email or NA,
            landlord_phone=ld.formatted_phone_number() or NA,
            landlord_address=get_landlord_address(v),
        )


EXAMPLE_VARS = EHPAAffadavitVars(
    tenant_name="Boop Jones",
    tenant_email="boop@jones.com",
    tenant_phone="(555) 123-4567",
    tenant_address="123 Boop Jones Place, Bronx, NY 10453",
    landlord_name="Landlordo Calrissian",
    landlord_email="landlordo@calrissian.net",
    landlord_phone="(555) 203-4032",
    landlord_address="1 Cloud City Drive, Bespin OH 43201",
)

# The page number of the cover sheet, which is actually intended
# to go at the beginning of the forms PDF rather than the end.
COVER_SHEET_PAGE = 0

# The page number that actually represents the fee waiver
# itself, and should be at the end of the forms PDF.
FEE_WAIVER_PAGE = 1

# Total pages in the rendered PDF.
TOTAL_PAGES = 2


def render_affadavit_pdf_html(vars: EHPAAffadavitVars) -> str:
    return render_pdf_html(
        None, "hpaction/ehpa-affadavit.html", context=vars.dict(), pdf_styles_path=PDF_STYLES_CSS
    )


def render_affadavit_pdf_for_user(user: JustfixUser) -> bytes:
    vars = EHPAAffadavitVars.from_user(user)
    html = render_affadavit_pdf_html(vars)
    return render_pdf_bytes(html)


def example_pdf(request):
    return pdf_response(render_affadavit_pdf_html(EXAMPLE_VARS), "example-ehpa-affadavit.pdf")
