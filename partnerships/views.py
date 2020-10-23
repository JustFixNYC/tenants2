from django.http import HttpResponseRedirect, HttpRequest, Http404

from .models import PartnerOrg
from . import referral


def activate_referral(request: HttpRequest, partner_slug: str):
    partner = PartnerOrg.objects.filter(slug=partner_slug).first()
    if partner is None:
        raise Http404()

    from twofactor.views import get_success_url

    referral.set_partner(request, partner)
    return HttpResponseRedirect(get_success_url(request))
