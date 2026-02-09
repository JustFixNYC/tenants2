from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from gceletter.letter_sending import gceletter_pdf_response, render_pdf_bytes, send_letter
from gceletter.util import (
    GCELetterPostData,
    LOBVerifyAddressData,
    PhoneNumberData,
    api,
    authorize_with_token,
    validate_request_data,
)
from gceletter.models import ComingSoonNotifyContacts, GCELetter, LandlordDetails, UserDetails
from project.util.lob_api import verify_address


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
@api
def submit_letter(request):
    """
    The POST endpoint used to create and send a GCE letter from the standalone
    Good Cause Eviction Letter Sender frontend.
    """

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    authorize_with_token(request, "bearer", settings.GCE_API_TOKEN)

    data = validate_request_data(request, GCELetterPostData)

    letter_data = data.to_dict(exclude=["user_details", "landlord_details"])
    letter = GCELetter.objects.create(**letter_data)

    landlord_data = {**data.landlord_details.to_dict(), "letter": letter}
    ld = LandlordDetails.objects.create(**landlord_data)

    user_data = {**data.user_details.to_dict(), "letter": letter}
    ud = UserDetails.objects.create(**user_data)

    errors = send_letter(letter)

    try:
        letter.trigger_followup_campaign_async()
        errors["textit_campaign"] = {"error": False}
    except Exception as e:
        errors["textit_campaign"] = {"error": True, "message": str(e)}

    return JsonResponse(
        {
            "errors": errors,
            "data": {
                "landlord_email": ld.email,
                "user_email": ud.email,
                "extra_emails": letter.extra_emails,
                "user_phone_number": ud.phone_number,
                "mail_choice": letter.mail_choice,
                "tracking_number": letter.tracking_number,
                "letter_pdf": letter.pdf_base64,
                "letter_url": letter.letter_hash_url,
                "reason": letter.reason,
                "good_cause_given": letter.good_cause_given,
            },
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

    return gceletter_pdf_response(render_pdf_bytes(letter.html_content))


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
            "data": {
                "url": request.build_absolute_uri(f"/gceletter/{letter.hash}/good-cause-letter.pdf")
            },
        },
        content_type="application/json",
        status=200,
    )


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
@api
def lob_verify_address(request):
    """
    For a given address check the deliverability with LOB API
    """

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    data = validate_request_data(request, LOBVerifyAddressData)

    verification = verify_address(**data.to_dict())

    return JsonResponse(
        verification,
        content_type="application/json",
        status=200,
    )


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
@api
def coming_soon_subscribe(request):
    """
    The POST endpoint used on the temporary "coming soon" page to sign up to get
    a text message when the Good Cause Eviction Letter Sender launches.
    """

    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    authorize_with_token(request, "bearer", settings.GCE_API_TOKEN)

    data = validate_request_data(request, PhoneNumberData)

    contact = ComingSoonNotifyContacts.objects.create(**data.to_dict())

    contact.full_clean()
    contact.save()

    contact.trigger_followup_campaign_async()

    return JsonResponse(
        {"success": True},
        content_type="application/json",
        status=200,
    )
