from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from gce.util import GcePostData, api, authorize_with_token, validate_data
from gce.models import GoodCauseEvictionScreenerResponse


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
@api
def upload(request):
    """
    The POST endpoint used to record user responses from the standalone Good
    Cause Eviction screener tool.
    """

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    authorize_with_token(request, "bearer", settings.GCE_API_TOKEN)

    data = validate_data(request)

    if not data.id:
        # This is usually from home page, but in some cases it could be a direct
        # link from results with no user id
        gcer = GoodCauseEvictionScreenerResponse(**data.dict_required_only())
        update_gce_record(gcer, data)
        gcer.full_clean()
        gcer.save()

    else:
        gcer = GoodCauseEvictionScreenerResponse.objects.get(id=data.id)
        update_gce_record(gcer, data)
        gcer.save()

    if data.phone_number:
        gcer.trigger_followup_campaign_async()

    return JsonResponse(
        {"id": gcer.pk},
        content_type="application/json",
        status=200,
    )


def update_gce_record(gcer: GoodCauseEvictionScreenerResponse, data: GcePostData):
    for key, value in data.dict_exclude_none().items():
        if key == "form_answers":
            col_name = (
                "form_answers_initial"
                if gcer.form_answers_initial is None
                else "form_answers_final"
            )
        elif key == "result_coverage":
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
