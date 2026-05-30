import json
import logging

from django.conf import settings
from django.http import Http404, HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .dhcr_portal_submit import submit_via_portal
from .forms import RhForm
from .models import RentalHistoryRequest

logger = logging.getLogger(__name__)


def _parse_body(request: HttpRequest) -> dict:
    if request.content_type == "application/json":
        return json.loads(request.body or b"{}")
    return request.POST.dict()


def _serialize_request(rhr: RentalHistoryRequest) -> dict:
    return {
        "id": rhr.pk,
        "created_at": rhr.created_at.isoformat() if rhr.created_at else None,
        "first_name": rhr.first_name,
        "last_name": rhr.last_name,
        "apartment_number": rhr.apartment_number,
        "phone_number": rhr.phone_number,
        "address": rhr.address,
        "address_verified": rhr.address_verified,
        "borough": rhr.borough,
        "zipcode": rhr.zipcode,
        "dhcr_reference_number": rhr.dhcr_reference_number,
        "user_id": rhr.user_id,
    }


@require_GET
def requests(request: HttpRequest) -> JsonResponse:
    if not settings.DEBUG:
        raise Http404()

    rows = RentalHistoryRequest.objects.order_by("-created_at", "-pk")
    return JsonResponse({"results": [_serialize_request(rhr) for rhr in rows]})


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
