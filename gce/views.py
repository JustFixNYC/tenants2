import json
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from gce.forms import get_validated_form_data
from gce.util import apply_cors_policy, authorize_with_token
from gce.models import GoodCauseEvictionScreenerResponse
# from mypy.django.http.request import HttpRequest


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
def upload(request):
    """
    The POST endpoint used to record user responses from the standalone Good
    Cause Eviction screener tool.
    """
    if request.method == "OPTIONS":
        return apply_cors_policy(
            HttpResponse(
                content_type="application/json",
                status=200,
            )
        )

    authorize_with_token(request, "bearer", settings.GCE_API_TOKEN)

    # The form doesn't seem to be able to access the body data, always returns empty values
    # data = get_validated_form_data(request.POST)

    data = json.loads(request.body.decode('utf-8'))

    # try:
    if not data.get("id"):
        gcer = GoodCauseEvictionScreenerResponse(**data)
        gcer.full_clean()
        gcer.save()

        # slack.sendmsg_async(get_slack_notify_text(gcer), is_safe=True)

    else:
        gcer = GoodCauseEvictionScreenerResponse.objects.get(id=data.get("id"))
        for key, value in data.items():
            setattr(gcer, key, value)
        gcer.save()

    # except Exception as e:
    #     return JsonResponse(
    #         {"error": "An internal server error occurred"},
    #         content_type="application/json",
    #         status=500,
    #     )

    return apply_cors_policy(
        JsonResponse(
            {"id": gcer.pk},
            content_type="application/json",
            status=200,
        )
    )
