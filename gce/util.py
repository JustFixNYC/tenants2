import functools
import logging
import json
import re
from pydantic import BaseModel, validator, ValidationError
from django.conf import settings
from django.http import JsonResponse
from decimal import Decimal
from typing import Any, Dict, Literal, Optional
from gce.models import GoodCauseEvictionScreenerResponse

logger = logging.getLogger(__name__)


Boroughs = Literal["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN_ISLAND"]

Coverage = Literal["COVERED", "NOT_COVERED", "UNKNOWN"]

YesNoUnsure = Literal["YES", "NO", "UNSURE"]


class FormAnswers(BaseModel):
    bedrooms: Literal["STUDIO", "1", "2", "3", "4+"]
    rent: Decimal
    owner_occupied: YesNoUnsure
    rent_stab: YesNoUnsure
    subsidy: Literal["NYCHA", "SUBSIDIZED", "NONE", "UNSURE"]
    portfolio_size: Optional[YesNoUnsure]


class GcePostData(BaseModel):
    id: Optional[int]
    bbl: Optional[str]
    house_number: Optional[str]
    street_name: Optional[str]
    borough: Optional[Boroughs]
    zipcode: Optional[str]
    address_confirmed: Optional[bool]
    nycdb_results: Optional[Dict[str, Any]]
    form_answers: Optional[FormAnswers]
    result_coverage: Optional[Coverage]
    result_criteria: Optional[Dict[str, Any]]

    # Still on v1 so can't use Optional[Annotated[str, Field(pattern="")]
    @validator("bbl")
    def bbl_must_match_pattern(cls, v):
        pattern = re.compile(r"^[1-5]\d{9}$")
        if not bool(pattern.match(v)):
            raise ValueError("BBL must be 10-digit zero padded string")
        return v

    # We're still on pydantic v1 so can't use Model.dict(exclude_none=True)
    def dict_exclude_none(self):
        return {k: v for k, v in self.dict().items() if v is not None}


def validate_data(request):
    try:
        data = GcePostData(**json.loads(request.body.decode("utf-8")))
    except (AssertionError, ValidationError) as e:
        raise DataValidationError(e.errors())
    return data


class DataValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors

    def as_json_response(self):
        return JsonResponse(
            {
                "error": "Invalid POST data",
                "details": json.dumps(self.errors),
            },
            status=400,
        )


def authorize_with_token(request, keyword, token):

    if "Authorization" not in request.headers:
        raise AuthorizationError("No authorization header provided")

    auth = request.headers.get("Authorization").split()

    if not auth or auth[0].lower() != keyword.lower():
        raise AuthorizationError("Invalid authorization header. No token provided.")

    if len(auth) == 1:
        raise AuthorizationError("Invalid token header. No credentials provided.")

    elif len(auth) > 2:
        raise AuthorizationError("Invalid token header. Token string should not contain spaces.")

    request_token = auth[1]

    if not (token == request_token):
        raise AuthorizationError("You do not have permission to access this resource")


class AuthorizationError(Exception):
    def __init__(self, msg):
        self.msg = msg

    def as_json_response(self):
        return JsonResponse(
            {
                "error": "Unauthorized request",
                "details": self.msg,
            },
            status=401,
        )


def apply_cors_policy(response):
    response["Access-Control-Allow-Origin"] = settings.GCE_ORIGIN
    response["Access-Control-Allow-Methods"] = "OPTIONS,POST"
    response["Access-Control-Max-Age"] = "1000"
    response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type, Authorization"
    return response


def api(fn):
    """
    Decorator for an API endpoint.
    """

    @functools.wraps(fn)
    def wrapper(request, *args, **kwargs):
        request.is_api_request = True
        try:
            response = fn(request, *args, **kwargs)
        except (DataValidationError, AuthorizationError) as e:
            logger.error(e)
            response = e.as_json_response()
        except GoodCauseEvictionScreenerResponse.DoesNotExist as e:
            logger.error(e)
            return JsonResponse(
                {"error": "User does not exist"},
                content_type="application/json",
                status=500,
            )
        except Exception as e:
            logger.error(e)
            response = JsonResponse(
                {"error": "An internal server error occurred"},
                content_type="application/json",
                status=500,
            )
        return apply_cors_policy(response)

    return wrapper
