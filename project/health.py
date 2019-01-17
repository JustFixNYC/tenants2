from django.http import JsonResponse


def check() -> JsonResponse:
    return JsonResponse({
        'status': 200
    }, status=200)
