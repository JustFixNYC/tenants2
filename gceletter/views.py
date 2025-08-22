import base64
from datetime import timezone
from io import BytesIO
import json
from django.conf import settings
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.forms.models import model_to_dict
from django.http.response import FileResponse
from django.core import signing


from gceletter.util import api, authorize_with_token, validate_data
from gceletter.models import GCELetter, LandlordDetails, UserDetails
from project.util import lob_api


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

    letter_data = data.to_dict(exclude=["user_details", "landlord_details"])
    gce_letter = GCELetter.objects.create(**letter_data)

    landlord_data = {**data.landlord_details.to_dict(), "letter": gce_letter}
    landlord_details = LandlordDetails.objects.create(**landlord_data)

    user_data = {**data.user_details.to_dict(), "letter": gce_letter}
    user_details = UserDetails.objects.create(**user_data)

    pdf_bytes = render_pdf_bytes(gce_letter.html_content)
    pdf_content = base64.b64encode(pdf_bytes).decode("utf-8")

    return JsonResponse(
        {
            "error": None,
            "data": {
                "user_details": model_to_dict(user_details),
                "landlord_details": model_to_dict(landlord_details),
                "letter": model_to_dict(gce_letter),
            },
            "pdf_content": pdf_content,
        },
        content_type="application/json",
        status=200,
    )


@csrf_exempt
@require_http_methods(["OPTIONS", "GET"])
@api
def gce_letter_pdf(request, hash):
    """
    PDF of GCE letter using hash for unique URL
    """
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
    """
    For a given phone number return a url for the most recent GCE letter pdf
    Could be called from TextIt to provide letter url to users
    """

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


# def mail_via_lob(letter):

#     signed_verifications = get_signed_verifications(landlord_verification, user_verification, False)

#     verifications = signing.loads(request.POST["signed_verifications"])
#     response = self._create_letter(request, letter, verifications)
#     letter.lob_letter_object = response
#     letter.tracking_number = response["tracking_number"]
#     letter.letter_sent_at = timezone.now()
#     letter.save()
#     self._log_letter_action(request, letter, "Mailed the letter via Lob.", CHANGE)
#     airtable.sync.sync_user(user)
#     slack.sendmsg_async(
#         f"{slack.escape(request.user.best_first_name)} has sent "
#         f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)}'s "
#         "letter of complaint!",
#         is_safe=True,
#     )

# def get_mail_confirmation_context(user):
#     landlord_details = user.landlord_details
#     onboarding_info = user.onboarding_info
#     ll_addr_details = landlord_details.get_or_create_address_details_model()

#     landlord_verification = lob_api.verify_address(**ll_addr_details.as_lob_params())
#     user_verification = lob_api.verify_address(**onboarding_info.as_lob_params())

#     return create_mail_confirmation_context(
#         landlord_verification=landlord_verification,
#         user_verification=user_verification,
#         is_manually_overridden=ll_addr_details.is_definitely_deliverable,
#     )

# def create_mail_confirmation_context(
#     landlord_verification, user_verification, is_manually_overridden: bool
# ):
#     is_deliverable = (
#         landlord_verification["deliverability"] != lob_api.UNDELIVERABLE
#         or is_manually_overridden
#     )

#     is_definitely_deliverable = (
#         landlord_verification["deliverability"] == lob_api.DELIVERABLE
#         and user_verification["deliverability"] == lob_api.DELIVERABLE
#     )

#     verifications = {
#         "landlord_verification": landlord_verification,
#         "landlord_verified_address": lob_api.get_address_from_verification(
#             landlord_verification
#         ),
#         "landlord_deliverability_docs": lob_api.get_deliverability_docs(landlord_verification),
#         "user_verification": user_verification,
#         "user_verified_address": lob_api.get_address_from_verification(user_verification),
#         "user_deliverability_docs": lob_api.get_deliverability_docs(user_verification),
#         "is_deliverable": is_deliverable,
#         "is_definitely_deliverable": is_definitely_deliverable,
#         "is_manually_overridden": is_manually_overridden,
#     }

#     return {"signed_verifications": signing.dumps(verifications), **verifications}
