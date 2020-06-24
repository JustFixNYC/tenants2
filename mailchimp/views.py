from typing import Optional, Set
import logging
from django.http import JsonResponse
from django.conf import settings
from django.core.validators import EmailValidator, ValidationError
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render

from . import mailchimp


logger = logging.getLogger(__name__)


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


def is_origin_valid(origin: str, valid_origins: Set[str]) -> bool:
    if '*' in valid_origins:
        return True
    return origin in valid_origins


def get_valid_origin(request) -> Optional[str]:
    origin: str = request.META.get('HTTP_ORIGIN', '')
    host_origin = request.build_absolute_uri('/')[:-1]
    valid_origins = set([*settings.MAILCHIMP_CORS_ORIGINS, host_origin])
    return origin if is_origin_valid(origin, valid_origins) else None


def render_subscribe_docs(request):
    return render(request, 'mailchimp/subscribe-docs.html', {
        'languages': [v.value for v in mailchimp.Language],
        'sources': [v.value for v in mailchimp.SubscribeSource],
        'origins': settings.MAILCHIMP_CORS_ORIGINS,
    })


def make_invalid_email_err():
    return make_json_error('INVALID_EMAIL', 400)


def mailchimp_err_to_json_err(e: mailchimp.MailChimpError):
    if mailchimp.is_fake_email_err(e):
        return make_invalid_email_err()
    logger.exception('An error occurred when subscribing to Mailchimp.')
    return make_json_error('INTERNAL_SERVER_ERROR', 500)


def subscribe_and_return_json(
    origin: str,
    email: str,
    language: mailchimp.Language,
    source: mailchimp.SubscribeSource
):
    if not is_email_valid(email):
        return make_invalid_email_err()

    try:
        mailchimp.subscribe(
            email=email,
            language=language,
            source=source,
        )
    except mailchimp.MailChimpError as e:
        return mailchimp_err_to_json_err(e)

    response = JsonResponse({'status': 200}, status=200)
    response['Access-Control-Allow-Origin'] = origin
    return response


def process_subscription(request):
    origin = get_valid_origin(request)
    if not origin:
        return make_json_error('INVALID_ORIGIN', 403)

    try:
        language = mailchimp.Language(request.POST.get('language', ''))
    except ValueError:
        return make_json_error('INVALID_LANGUAGE', 400)

    try:
        source = mailchimp.SubscribeSource(request.POST.get('source', ''))
    except ValueError:
        return make_json_error('INVALID_SOURCE', 400)

    return subscribe_and_return_json(
        origin=origin,
        email=request.POST.get('email', ''),
        language=language,
        source=source,
    )


@require_http_methods(["GET", "POST"])
@csrf_exempt
def subscribe(request):
    '''
    Subscribes an email address to our MailChimp list.

    Paste the URL for this endpoint into a browser to
    see documentation for it.
    '''

    if not settings.MAILCHIMP_API_KEY:
        return make_json_error('MAILCHIMP_DISABLED', 404)

    if request.method == "GET":
        return render_subscribe_docs(request)

    return process_subscription(request)
