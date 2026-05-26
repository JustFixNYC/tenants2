import json
import logging
from typing import Any, Dict

import django.core.exceptions as dje
import pydantic
import pydantic.error_wrappers as pde
from django.http import HttpResponse, JsonResponse
from django.core.validators import validate_email
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from project.util import phone_number as pn
from project.util.address_form_fields import BOROUGH_CHOICES
from rh import dhcr
from rh.models import RentalHistoryRequest


logger = logging.getLogger(__name__)

CITY_TO_BOROUGH = {
    "bronx": BOROUGH_CHOICES.BRONX,
    "brooklyn": BOROUGH_CHOICES.BROOKLYN,
    "kings": BOROUGH_CHOICES.BROOKLYN,
    "manhattan": BOROUGH_CHOICES.MANHATTAN,
    "new york": BOROUGH_CHOICES.MANHATTAN,
    "queens": BOROUGH_CHOICES.QUEENS,
    "staten island": BOROUGH_CHOICES.STATEN_ISLAND,
    "richmond": BOROUGH_CHOICES.STATEN_ISLAND,
}


class RhRequestData(pydantic.BaseModel):
    email: str
    first_name: str
    last_name: str
    phone: str
    street: str
    apt: str
    city: str
    zip: str

    @pydantic.validator("email")  # type: ignore
    def email_must_be_valid(cls, v):
        try:
            validate_email(v)
        except dje.ValidationError as e:
            raise ValueError(getattr(e, "message", "Enter a valid email address."))
        return v

    @pydantic.validator("phone")  # type: ignore
    def phone_must_be_valid(cls, v):
        try:
            pn.validate_phone_number(v)
        except dje.ValidationError as e:
            raise ValueError(getattr(e, "message"))
        return v

    @pydantic.validator("zip")  # type: ignore
    def zip_must_be_valid(cls, v):
        if not (v.isdigit() and len(v) == 5):
            raise ValueError("ZIP code must be 5 digits.")
        return v

    @pydantic.validator("city")  # type: ignore
    def city_must_map_to_borough(cls, v):
        if v.strip().lower() not in CITY_TO_BOROUGH:
            raise ValueError("City must be a New York City borough.")
        return v

    def get_borough(self) -> str:
        return CITY_TO_BOROUGH[self.city.strip().lower()]

    def to_dhcr_request(self) -> dhcr.DhcrRentHistoryRequest:
        return dhcr.DhcrRentHistoryRequest(**self.dict())


class DataValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors

    def as_json_response(self):
        return JsonResponse(
            {
                "error": "Invalid POST data",
                "details": self.errors,
            },
            status=400,
        )


def get_payload(request) -> Dict[str, Any]:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except ValueError:
        raise DataValidationError("Request body must be valid JSON.")
    if not isinstance(payload, dict):
        raise DataValidationError("Request body must be a JSON object.")
    if isinstance(payload.get("user_data"), dict):
        return payload["user_data"]
    return payload


def validate_data(request) -> RhRequestData:
    try:
        return RhRequestData(**get_payload(request))
    except pde.ValidationError as e:
        raise DataValidationError(e.errors())


@csrf_exempt
@require_http_methods(["OPTIONS", "POST"])
def submit_rent_history_request(request):
    if request.method == "OPTIONS":
        return HttpResponse(status=200)

    request.is_api_request = True

    try:
        data = validate_data(request)
        reference_number = dhcr.submit_rent_history_request(data.to_dhcr_request())

        rhr = RentalHistoryRequest(
            first_name=data.first_name,
            last_name=data.last_name,
            apartment_number=data.apt,
            phone_number=data.phone,
            address=data.street,
            address_verified=False,
            borough=data.get_borough(),
            zipcode=data.zip,
            dhcr_reference_number=reference_number,
        )
        rhr.full_clean()
        rhr.save()
    except DataValidationError as e:
        return e.as_json_response()
    except dhcr.DhcrSubmissionError as e:
        logger.error(e)
        return JsonResponse(
            {"error": "DHCR submission failed", "details": str(e)},
            status=502,
        )

    return JsonResponse(
        {"reference_number": reference_number},
        content_type="application/json",
        status=201,
    )
