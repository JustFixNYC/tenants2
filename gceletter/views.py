import json
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict

from gceletter.util import api, authorize_with_token, validate_data
from gceletter.models import GCELetter


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
@api
def upload(request):
    """
    The POST endpoint used to create GCE letter from the standalone Good
    Cause Eviction Letter Sender frontend.
    """

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    authorize_with_token(request, "bearer", settings.GCE_API_TOKEN)

    data = validate_data(request)

    gce_letter = GCELetter(**data.dict_exclude_none())

    gce_letter.full_clean()
    gce_letter.save()

    return JsonResponse(
        {"error": None, "data": model_to_dict(gce_letter)},
        content_type="application/json",
        status=200,
    )
