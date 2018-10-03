from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest
from django.shortcuts import redirect
from django.conf import settings

from .models import LegacyUserInfo
from .mongo import create_autologin_doc


@login_required
def redirect_to_legacy_app(request):
    if not LegacyUserInfo.is_legacy_user(request.user):
        return HttpResponseBadRequest()
    key = create_autologin_doc(request.user.phone_number)
    url = f'{settings.LEGACY_ORIGIN}/auto-signin?key={key}'
    return redirect(url)
