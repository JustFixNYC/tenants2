import base64
from io import BytesIO
import json
from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.http.response import FileResponse


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

    pdf_bytes = render_pdf_bytes(gce_letter.html_content)
    pdf_content = base64.b64encode(pdf_bytes).decode("utf-8")

    return JsonResponse(
        {
            "error": None,
            "data": model_to_dict(gce_letter),
            "pdf_content": pdf_content,
        },
        content_type="application/json",
        status=200,
    )


@csrf_exempt
@require_http_methods(["OPTIONS", "GET"])
@api
def gce_letter_pdf(request, hash):
    # PDF of GCE letters using hash for unique URL
    # TODO: this endpoint needs to be accessible from any origin

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    letter = GCELetter.objects.filter(hash=hash).order_by("-created_at").first()

    if not letter:
        return HttpResponse(status=404)

    return FileResponse(BytesIO(render_pdf_bytes(letter.html_content)), filename="gce-letter.pdf")


@csrf_exempt
@require_http_methods(["OPTIONS", "GET"])
@api
def get_letter_link(request):
    # For a given phone number return a url for the most recent GCE letter pdf
    # Could be called from TextIt to provide letter url to users

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    phone = request.GET.get("phone")

    letter = GCELetter.objects.filter(phone_number=phone).order_by("-created_at").first()

    if not letter:
        return HttpResponse(status=404)

    return JsonResponse(
        {
            "error": None,
            "data": request.build_absolute_uri(f"/gceletter/{letter.hash}/gce-letter.pdf"),
        },
        content_type="application/json",
        status=200,
    )


def render_pdf_bytes(html: str, css: str = None) -> bytes:
    import weasyprint
    from weasyprint.fonts import FontConfiguration

    font_config = FontConfiguration()

    # see loc/views.py render_pdf_bytes() for adding stylesheets

    return weasyprint.HTML(string=html).write_pdf(font_config=font_config)
