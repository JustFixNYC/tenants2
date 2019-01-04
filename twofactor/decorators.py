from functools import wraps
from django.contrib.auth.views import redirect_to_login
from django.urls import reverse

from .util import is_request_user_verified


def twofactor_required(view_func):
    '''
    Require that the current user is authenticated and
    verified via two-factor auth. If they are not, they
    will be redirected.
    '''

    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if is_request_user_verified(request):
            return view_func(request, *args, **kwargs)
        path = request.build_absolute_uri()
        # This function is called redirect_to_login, but
        # we're reusing it for its generic logic of
        # adding a 'next' querystring argument to a URL.
        return redirect_to_login(
            next=path,
            login_url=reverse('verify'),
            redirect_field_name='next'
        )
    return _wrapped_view
