from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt


def make_json_error(message: str, status: int) -> JsonResponse:
    response = JsonResponse({
        'status': status,
        'message': message,
    }, status=status)
    response['Access-Control-Allow-Origin'] = '*'
    return response


@require_POST
@csrf_exempt
def subscribe(request):
    origin: str = request.META.get('HTTP_ORIGIN', '')
    if origin not in settings.MAILCHIMP_CORS_ORIGINS:
        return make_json_error('Invalid origin.', 403)
    email: str = request.POST.get('email', '')
    language: str = request.POST.get('language', '')

    # TODO: Validate arguments.
    response = JsonResponse({
        'status': 200
    }, status=200)
    response['Access-Control-Allow-Origin'] = origin
    return response
