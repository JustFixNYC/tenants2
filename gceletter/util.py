import functools
import logging
import json
import re
import pydantic
from typing import Dict, List, Literal, Optional
from django.conf import settings
from django.http import JsonResponse
import pydantic.error_wrappers as pde
import django.core.exceptions as dje


from gceletter.models import GCELetter
from project.util import phone_number as pn

logger = logging.getLogger(__name__)


Boroughs = Literal["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN_ISLAND"]


class BaseModelDict(pydantic.BaseModel):
    # Our older version of pydantic is lacking some of the helpful methods for
    # getting a dict from the model
    def to_dict(self, exclude: List[str] = [], include: List[str] = [], exclude_none: bool = False):
        if exclude and include:
            raise ValueError("Can't provide arguments for both 'include' and 'exclude'")

        def predicate(key, value):
            if exclude_none and value is None:
                return False
            if exclude:
                return False if key in exclude else True
            if include:
                return True if key in include else False
            return True

        return {k: v for k, v in self.dict().items() if predicate(k, v)}


class LOBAddressData(BaseModelDict):
    primary_line: str
    secondary_line: Optional[str]
    urbanization: Optional[str]
    city: str
    state: str
    zip_code: str

    @pydantic.root_validator(allow_reuse=True)
    def urbanization_required_for_pr(cls, values):
        if values.get("state") == "PR" and values.get("urbanization") is None:
            raise ValueError("Urbanization field is required when state is Puerto Rico")
        return values

    @pydantic.validator("zip_code")  # type: ignore
    def zip_code_valid_format(cls, v):
        match = re.match(r"^[0-9]{5}(?:-[0-9]{4})?$", v)
        if not match:
            raise ValueError(
                "Zip Code must be valid 5 digit ZIP or or ZIP+4 format (eg. '12345-1234')"
            )
        return v


class UserDetailsData(LOBAddressData):
    first_name: str
    last_name: str
    email: str
    phone_number: str
    bbl: str

    # Mypy is not recognizing "validator" as import
    @pydantic.validator("bbl")  # type: ignore
    def bbl_must_match_pattern(cls, v):
        pattern = re.compile(r"^[1-5]\d{9}$")
        if not bool(pattern.match(v)):
            raise ValueError("BBL must be 10-digit zero padded string")
        return v

    @pydantic.validator("phone_number")  # type: ignore
    def phone_number_must_be_valid(cls, v):
        try:
            pn.validate_phone_number(v)
        except dje.ValidationError as e:
            # Avoid mixing pydantic and django versions of ValidationError
            raise ValueError(getattr(e, "message"))
        return v


class LandlordDetailsData(LOBAddressData):
    name: str
    email: Optional[str]


class GCELetterPostData(BaseModelDict):
    user_details: UserDetailsData
    landlord_details: LandlordDetailsData
    mail_choice: str
    email_to_landlord: bool
    html_content: str


def validate_data(data: Dict[str, any], cls: pydantic.BaseModel):
    try:
        data = cls(**data)
    except pde.ValidationError as e:
        if getattr(e, "errors"):
            raise DataValidationError(e.errors())
        else:
            raise DataValidationError(getattr(e, "msg"))
    except AssertionError as e:
        raise DataValidationError(getattr(e, "msg"))
    return data


def validate_request_data(request, cls):
    data = json.loads(request.body.decode("utf-8"))
    return validate_data(data, cls)


class DataValidationError(Exception):
    def __init__(self, errors):
        self.errors = errors

    def __str__(self):
        return f"GCELetter: Invalid POST data. {json.dumps(self.errors)}"

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
    valid_origins = set(settings.GCE_CORS_ALLOWED_ORIGINS + [host_origin])
    if "*" in valid_origins:
        return True
    if origin in valid_origins:
        return True
    for pattern in settings.GCE_CORS_ALLOWED_ORIGIN_REGEXES:
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
        origin if is_valid_origin(request) else settings.GCE_ORIGIN
    )
    response["Access-Control-Allow-Methods"] = "OPTIONS,POST,GET"
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
        except Exception as e:
            logger.error(e)
            response = JsonResponse(
                {"error": "An internal server error occurred"},
                content_type="application/json",
                status=500,
            )
        return apply_cors_policy(request, response)

    return wrapper
