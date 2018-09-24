from pathlib import Path
from django.http import HttpResponseRedirect, HttpRequest
from django.urls import path
from django.views.decorators.http import require_POST


MY_DIR = Path(__file__).parent.resolve()

SESSION_KEY = 'enable_safe_mode'

SAFE_MODE_JS = MY_DIR / 'safe-mode.min.js'


def is_enabled(request: HttpRequest) -> bool:
    return request.session.get(SESSION_KEY, False)


@require_POST
def enable(request: HttpRequest):
    request.session[SESSION_KEY] = True
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))


@require_POST
def disable(request: HttpRequest):
    request.session[SESSION_KEY] = False
    return HttpResponseRedirect(request.META.get('HTTP_REFERER', '/'))


app_name = 'safe_mode'

urlpatterns = [
    path('enable', enable, name='enable'),
    path('disable', disable, name='disable'),
]
