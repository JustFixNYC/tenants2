import functools
import logging
import json
from typing import Optional

import pydantic
from django.conf import settings
from django.http import JsonResponse
import pydantic.error_wrappers as pde
import django.core.exceptions as dje

from efnyc.models import EfnycPhoneNumber
from project.util import phone_number as pn

logger = logging.getLogger(__name__)


class EfnycPostData(pydantic.BaseModel):
    phone_number: Optional[str]

    @pydantic.validator("phone_number")  # type: ignore
    def phone_number_must_be_valid(cls, v):
        try:
            pn.validate_phone_number(v)
        except dje.ValidationError as e:
            # Avoid mixing pydantic and django versions of ValidationError
            raise ValueError(getattr(e, "message"))
        return v

    def dict_exclude_none(self):
        return {k: v for k, v in self.dict().items() if v is not None}


def validate_data(request):
    try:
        data = EfnycPostData(**json.loads(request.body.decode("utf-8")))
    except pde.ValidationError as e:
        if getattr(e, "errors"):
            raise DataValidationError(e.errors())
        else:
            raise DataValidationError(getattr(e, "msg"))
    except AssertionError as e:
        raise DataValidationError(getattr(e, "msg"))
    return data


class DataValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors

    def __str__(self):
        return f"EFNYC: Invalid POST data. {json.dumps(self.errors)}"

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


class InvalidOriginError(Exception):
    def __init__(self, msg):
        self.msg = msg

    def as_json_response(self):
        return JsonResponse(
            {
                "error": "Invalid origin",
                "details": self.msg,
            },
            status=403,
        )


def is_valid_origin(request):
    origin: str = request.META.get("HTTP_ORIGIN", "")
    host_origin = request.build_absolute_uri("/")[:-1]
    valid_origins = set(getattr(settings, "EFNYC_CORS_ALLOWED_ORIGINS", []) + [host_origin])

    if "*" in valid_origins:
        return True
    if origin in valid_origins:
        return True
    for pattern in getattr(settings, "EFNYC_CORS_ALLOWED_ORIGIN_REGEXES", []):
        import re

        if re.match(pattern, origin):
            return True
    return False


def validate_origin(request):
    origin: str = request.META.get("HTTP_ORIGIN", "")
    if not is_valid_origin(request):
        raise InvalidOriginError(f"{origin} is not a valid origin")


def apply_cors_policy(request, response):
    origin: str = request.META.get("HTTP_ORIGIN", "")
    response["Access-Control-Allow-Origin"] = (
        origin if is_valid_origin(request) else getattr(settings, "EFNYC_ORIGIN", "*")
    )
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
            validate_origin(request)
            response = fn(request, *args, **kwargs)
        except (DataValidationError, AuthorizationError, InvalidOriginError) as e:
            logger.error(str(e))
            response = e.as_json_response()
        except EfnycPhoneNumber.DoesNotExist as e:
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
        return apply_cors_policy(request, response)

    return wrapper
