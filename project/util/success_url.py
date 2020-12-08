from django.utils.http import is_safe_url


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
