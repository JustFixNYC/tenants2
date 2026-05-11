import json
import logging

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .email_dhcr import send_email_to_dhcr
from .forms import RhForm, RhSendEmail
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

    return JsonResponse({"id": rhr.pk}, status=201)


@csrf_exempt
@require_POST
def send_email(request: HttpRequest) -> JsonResponse:
    data = _parse_body(request)
    form = RhSendEmail(data)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)

    rhr_id = data.get("id")
    try:
        rhr = RentalHistoryRequest.objects.get(pk=rhr_id)
    except RentalHistoryRequest.DoesNotExist:
        return JsonResponse({"errors": {"id": ["not found"]}}, status=400)

    subject = f"Rent history request for {rhr.address}"
    body = (
        f"Tenant: {rhr.first_name} {rhr.last_name}\n"
        f"Address: {rhr.address}, apt {rhr.apartment_number}\n"
        f"Borough: {rhr.borough}\n"
    )
    send_email_to_dhcr(subject, body)

    return JsonResponse({"sent": True})
