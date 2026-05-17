import json
import logging

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

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

    return JsonResponse({"id": rhr.pk}, status=201)
