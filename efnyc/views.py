import logging
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from efnyc.util import EfnycPostData, api, authorize_with_token, validate_data
from efnyc.models import EfnycPhoneNumber

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
@api
def upload(request):
    """
    The POST endpoint used to record phone numbers for the EFNYC app.
    This mirrors the gce upload endpoint but only accepts phone numbers.
    """

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    authorize_with_token(request, "bearer", settings.EFNYC_API_TOKEN)

    data = validate_data(request)

    efnyc_record = EfnycPhoneNumber()

    update_efnyc_record(efnyc_record, data)

    efnyc_record.full_clean()
    efnyc_record.save()

    return JsonResponse(
        {"id": efnyc_record.pk},
        content_type="application/json",
        status=200,
    )


def update_efnyc_record(efnyc_record: EfnycPhoneNumber, data: EfnycPostData):
    for key, value in data.dict_exclude_none().items():
        if hasattr(efnyc_record, key):
            setattr(efnyc_record, key, value)
        else:
            logger.warning(f"EFNYC update - No attribute '{key}' on EfnycPhoneNumber model")
