import logging
from django.shortcuts import redirect
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings

import project.health


logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def example_server_error(request, id: str):
    '''
    This endpoint can be used to test integration with whatever
    error reporting system is configured.
    '''

    logger.error(
        f"This is an example server error log message with id '{id}'. "
        f"If you can read this, it means errors from the logging system "
        f"are being reported properly."
    )
    raise Exception(
        f"This is an example server exception with id '{id}'. "
        f"If you can read this, it means unexpected internal server "
        f"errors are being reported properly."
    )


def redirect_favicon(request):
    return redirect(f'{settings.STATIC_URL}favicon.ico')


def health(request):
    is_extended = request.GET.get('extended') == settings.EXTENDED_HEALTHCHECK_KEY
    return project.health.check(is_extended).to_json_response()
