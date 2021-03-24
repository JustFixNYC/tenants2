from pathlib import Path
from django.http import HttpResponseRedirect, HttpRequest
from django.urls import path
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt

from frontend.models import LoggedEvent


MY_DIR = Path(__file__).parent.resolve()

SESSION_KEY = "enable_safe_mode"

SAFE_MODE_JS = MY_DIR / "safe-mode.min.js"

SAFE_MODE_HISTORY_FIX_JS = MY_DIR / "safe-mode-history-fix.js"


def is_enabled(request: HttpRequest) -> bool:
    return request.session.get(SESSION_KEY, False)


# The page we're on might be dynamic and perform login/logout
# without a page refresh, which would reset the CSRF token. Since
# enabling/disabling safe mode doesn't meaningfully change the
# server state in any way or impact the user experience in an
# irrevocable way--i.e., exempting it from CSRF won't introduce
# vulnerabilities--we're just going to avoid such issues by
# disabling CSRF.


@csrf_exempt
@require_POST
def enable(request: HttpRequest):
    request.session[SESSION_KEY] = True
    LoggedEvent.objects.create_for_request(request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE)
    return HttpResponseRedirect(request.META.get("HTTP_REFERER", "/"))


@csrf_exempt
@require_POST
def disable(request: HttpRequest):
    request.session[SESSION_KEY] = False
    LoggedEvent.objects.create_for_request(request, kind=LoggedEvent.CHOICES.SAFE_MODE_DISABLE)
    return HttpResponseRedirect(request.META.get("HTTP_REFERER", "/"))


app_name = "safe_mode"

urlpatterns = [
    path("enable", enable, name="enable"),
    path("disable", disable, name="disable"),
]
