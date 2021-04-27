from functools import wraps

from .util import is_request_user_verified, redirect_request_to_verify


def twofactor_required(view_func):
    """
    Require that the current user is authenticated and
    verified via two-factor auth. If they are not, they
    will be redirected.
    """

    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if is_request_user_verified(request):
            return view_func(request, *args, **kwargs)
        return redirect_request_to_verify(request)

    return _wrapped_view
