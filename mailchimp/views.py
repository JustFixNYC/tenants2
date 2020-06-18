from typing import Optional
from django.http import JsonResponse
from django.conf import settings
from django.core.validators import EmailValidator, ValidationError
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from . import mailchimp


def make_json_error(error_code: str, status: int) -> JsonResponse:
    response = JsonResponse({
        'status': status,
        'errorCode': error_code,
    }, status=status)
    response['Access-Control-Allow-Origin'] = '*'
    return response


def is_email_valid(value: str) -> bool:
    try:
        EmailValidator()(value)
        return True
    except ValidationError:
        return False


def validate_language(value: str) -> Optional[mailchimp.Language]:
    try:
        return mailchimp.Language(value)
    except ValueError:
        return None


def validate_source(value: str) -> Optional[mailchimp.SubscribeSource]:
    try:
        return mailchimp.SubscribeSource(value)
    except ValueError:
        return None


@require_POST
@csrf_exempt
def subscribe(request):
    origin: str = request.META.get('HTTP_ORIGIN', '')
    if origin not in settings.MAILCHIMP_CORS_ORIGINS:
        return make_json_error('INVALID_ORIGIN', 403)
    email: str = request.POST.get('email', '')
    language = validate_language(request.POST.get('language', ''))
    source = validate_source(request.POST.get('source', ''))

    if not is_email_valid(email):
        return make_json_error('INVALID_EMAIL', 400)

    if not language:
        return make_json_error('INVALID_LANGUAGE', 400)

    if not source:
        return make_json_error('INVALID_SOURCE', 400)

    mailchimp.subscribe(
        email=email,
        language=language,
        source=source,
    )

    response = JsonResponse({
        'status': 200
    }, status=200)
    response['Access-Control-Allow-Origin'] = origin
    return response
