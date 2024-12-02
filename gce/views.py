import json
import pydantic
import logging
from decimal import Decimal
from typing import Any, Dict, Optional
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from gce.util import apply_cors_policy, authorize_with_token
from gce.models import GoodCauseEvictionScreenerResponse

logger = logging.getLogger(__name__)


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
def upload(request):
    """
    The POST endpoint used to record user responses from the standalone Good
    Cause Eviction screener tool.
    """
    if request.method == "OPTIONS":
        return apply_cors_policy(HttpResponse(status=200))

    authorize_with_token(request, "bearer", settings.GCE_API_TOKEN)

    try:
        data = GcePostData(**json.loads(request.body.decode("utf-8")))

        if not data.id:
            gcer = GoodCauseEvictionScreenerResponse(**exclude_none_dict(data))
            gcer.full_clean()
            gcer.save()

        else:
            gcer = GoodCauseEvictionScreenerResponse.objects.get(id=data.id)
            update_gce_record(gcer, data)
            gcer.save()

    except Exception as e:
        logger.error(e)

        return JsonResponse(
            {"error": "An internal server error occurred"},
            content_type="application/json",
            status=500,
        )

    return apply_cors_policy(
        JsonResponse(
            {"id": gcer.pk},
            content_type="application/json",
            status=200,
        )
    )


class GcePostData(pydantic.BaseModel):
    id: Optional[int]
    bbl: Optional[str]
    house_number: Optional[str]
    street_name: Optional[str]
    borough: Optional[str]
    zipcode: Optional[str]
    address_confirmed: Optional[bool]
    nycdb_results: Optional[Dict[str, Any]]
    form_bedrooms: Optional[str]
    form_rent: Optional[Decimal]
    form_owner_occupied: Optional[str]
    form_rent_stab: Optional[str]
    form_subsidy: Optional[str]
    result_coverage: Optional[str]
    result_criteria: Optional[Dict[str, Any]]


# We're still on pydantic v1 so can't use Model.dict(exclude_none=True)
def exclude_none_dict(model):
    return {k: v for k, v in model.dict().items() if v is not None}


def update_gce_record(gcer: GoodCauseEvictionScreenerResponse, data: GcePostData):
    for key, value in exclude_none_dict(data).items():
        # TODO: Should we allow updates of the form response?
        if key == "result_coverage":
            col_name = (
                "result_coverage_initial"
                if gcer.result_coverage_initial is None
                else "result_coverage_final"
            )
        elif key == "result_criteria":
            col_name = (
                "result_criteria_initial"
                if gcer.result_criteria_initial is None
                else "result_criteria_final"
            )
        else:
            col_name = key
        setattr(gcer, col_name, value)
