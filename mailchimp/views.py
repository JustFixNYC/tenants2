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


@require_POST
@csrf_exempt
def subscribe(request):
    '''
    Subscribes an email address to our MailChimp list.

    This POST endpoint requires a CORS request with the
    following application/x-www-form-urlencoded arguments:

      * `email` is the email address to subscribe.

      * `language` is the ISO 639-1 locale of the subscriber
        (e.g. `en` or `es`).

      * `source` is the source from which the subscriber is
        subscribing. It should be one of the values from
        the `SubscribeSource` enumeration (e.g. `wow`).

    The request must come from an origin in the
    MAILCHIMP_CORS_ORIGINS setting. If it isn't, a HTTP 403
    will be returned.

    If any of the arguments are invalid, a HTTP 400 will be
    returned, and the JSON response will contain an `errorCode`
    value of `INVALID_EMAIL`, `INVALID_LANGUAGE`, or `INVALID_SOURCE`.

    Otherwise, a HTTP 200 will be returned.
    '''

    if not settings.MAILCHIMP_API_KEY:
        return make_json_error('MAILCHIMP_DISABLED', 404)

    origin: str = request.META.get('HTTP_ORIGIN', '')
    if origin not in settings.MAILCHIMP_CORS_ORIGINS:
        return make_json_error('INVALID_ORIGIN', 403)

    try:
        language = mailchimp.Language(request.POST.get('language', ''))
    except ValueError:
        return make_json_error('INVALID_LANGUAGE', 400)

    try:
        source = mailchimp.SubscribeSource(request.POST.get('source', ''))
    except ValueError:
        return make_json_error('INVALID_SOURCE', 400)

    email: str = request.POST.get('email', '')
    if not is_email_valid(email):
        return make_json_error('INVALID_EMAIL', 400)

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
