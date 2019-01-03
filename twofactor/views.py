from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.contrib.auth.decorators import login_required
from django.utils.http import is_safe_url
import logging

from .models import TwofactorInfo
from . import util


logger = logging.getLogger(__name__)


def get_success_url(request, redirect_field_name='next', default='/') -> str:
    '''
    Return the success URL identified by the given redirect field name in
    the request's POST or GET parameters.  If it is not provided or is unsafe,
    return the given default URL.
    '''

    # This is mostly cribbed from django.contrib.auth.views.LoginView.
    redirect_to = request.POST.get(
        redirect_field_name,
        request.GET.get(redirect_field_name, '')
    )
    url_is_safe = is_safe_url(
        url=redirect_to,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    )
    return redirect_to if url_is_safe else default


@login_required
def verify(request):
    '''
    Authenticate the currently logged-in user via a Time-based One-time Password (TOTP),
    which classifies them as "verified", then redirect them to a success URL passed-in
    through the 'next' querystring argument.

    If the user has never set up their 2FA, their TOTP provisioning URI and QR code
    will be presented to them so that they can set everything up.

    If the user is already verified, this view will automatically redirect them to
    the success URL.
    '''

    success_url = get_success_url(request)
    if util.is_request_user_verified(request):
        return HttpResponseRedirect(success_url)

    twofactor, _ = TwofactorInfo.objects.get_or_create(user=request.user)
    error = None
    if request.method == 'POST':
        otp: str = request.POST.get('otp', '').replace(' ', '')
        if twofactor.totp.verify(otp):
            util.verify_request_user(request)
            return HttpResponseRedirect(success_url)
        else:
            error = "Alas, your one-time password is invalid."
            logger.warn(f'The user {request.user} submitted an invalid 2FA OTP.')

    return render(request, 'twofactor/verify.html', {
        'error': error,
        'next': success_url,
        'twofactor': twofactor
    })
