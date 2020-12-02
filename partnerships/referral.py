from typing import Optional
from django.http import HttpRequest

from .models import PartnerOrg


PARTNER_REFERRAL_SESSION_KEY = f"active_partner_referral"


def set_partner(request: HttpRequest, partner: PartnerOrg):
    """
    Set the partner organization associated with the current
    request.
    """

    request.session[PARTNER_REFERRAL_SESSION_KEY] = partner.slug


def get_partner(request: HttpRequest) -> Optional[PartnerOrg]:
    """
    Get the partner organization, if any, associated with the
    current request.
    """

    slug = request.session.get(PARTNER_REFERRAL_SESSION_KEY)
    if slug:
        return PartnerOrg.objects.filter(slug=slug).first()
    return None
