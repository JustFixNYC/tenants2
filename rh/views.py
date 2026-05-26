import json
import logging

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .dhcr_portal_submit import submit_via_portal
from .forms import RhForm
from .models import RentalHistoryRequest

logger = logging.getLogger(__name__)


def _parse_body(request: HttpRequest) -> dict:
    if request.content_type == "application/json":
        return json.loads(request.body or b"{}")
    return request.POST.dict()


@csrf_exempt
@require_POST
def submit(request: HttpRequest) -> JsonResponse:
    data = _parse_body(request)
    form = RhForm(data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)

    rhr: RentalHistoryRequest = form.save(commit=False)
    if request.user.is_authenticated:
        rhr.user = request.user
    cd = form.cleaned_data
    rhr.phone_number = cd.get("phone_number", "")
    rhr.address = cd.get("address", "")
    rhr.borough = cd.get("borough", "")
    rhr.zipcode = cd.get("zipcode", "")
    rhr.address_verified = cd.get("address_verified", False)
    rhr.save()

    portal_result = submit_via_portal(rhr)
    if portal_result.reference_number:
        rhr.dhcr_reference_number = portal_result.reference_number
        rhr.save(update_fields=["dhcr_reference_number"])

    return JsonResponse(
        {
            "id": rhr.pk,
            "portal": {
                "dry_run": portal_result.dry_run,
                "success": portal_result.success,
                "reference_number": portal_result.reference_number,
                "error": portal_result.error,
            },
        },
        status=201,
    )
