from django.utils.http import url_has_allowed_host_and_scheme


def get_success_url(request, redirect_field_name="next", default="/") -> str:
    """
    Return the success URL identified by the given redirect field name in
    the request's POST or GET parameters.  If it is not provided or is unsafe,
    return the given default URL.
    """

    # This is mostly cribbed from django.contrib.auth.views.LoginView.
    redirect_to = request.POST.get(redirect_field_name, request.GET.get(redirect_field_name, ""))
    url_is_safe = url_has_allowed_host_and_scheme(
        url=redirect_to,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    )
    return redirect_to if url_is_safe else default
