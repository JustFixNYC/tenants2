from typing import Any, Dict
from django.http import JsonResponse
from django.conf import settings


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


def apply_cors_policy(response):
    response["Access-Control-Allow-Origin"] = settings.GCE_ORIGIN
    response["Access-Control-Allow-Methods"] = "OPTIONS,POST"
    response["Access-Control-Max-Age"] = "1000"
    response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type, Authorization"
    return response
