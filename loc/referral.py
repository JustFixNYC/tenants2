"""
Referral system for Letter of Complaint splash pages.

This allows different referral URLs (e.g., /loc/splash-upt) to pre-fill
landlord details when users create accounts.
"""
from typing import Optional, Dict, Any
from django.http import HttpRequest


LOC_REFERRAL_SESSION_KEY = "loc_referral_code"


# Configuration mapping referral codes to landlord details
# This can be expanded to include more referral codes as needed
REFERRAL_LANDLORD_DETAILS: Dict[str, Dict[str, Any]] = {
    "upt": {
        "name": "UPT Landlord",
        "primary_line": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "email": "",
        "phone_number": "",
    },
}


def set_referral_code(request: HttpRequest, referral_code: str):
    """
    Set the referral code associated with the current request.
    This will be used to pre-fill landlord details during account creation.
    """
    request.session[LOC_REFERRAL_SESSION_KEY] = referral_code


def get_referral_code(request: HttpRequest) -> Optional[str]:
    """
    Get the referral code, if any, associated with the current request.
    """
    return request.session.get(LOC_REFERRAL_SESSION_KEY)


def get_landlord_details_for_referral(referral_code: str) -> Optional[Dict[str, Any]]:
    """
    Get the pre-configured landlord details for a given referral code.
    Returns None if the referral code doesn't exist.
    """
    return REFERRAL_LANDLORD_DETAILS.get(referral_code)

