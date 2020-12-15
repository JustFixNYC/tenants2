from django.urls import reverse, NoReverseMatch
from django.core.exceptions import MiddlewareNotUsed

from .util import is_request_user_verified, redirect_request_to_verify


def admin_requires_2fa_middleware(get_response):
    try:
        admin_prefix = reverse("admin:index")
    except NoReverseMatch:
        # The admin site isn't installed, likely because
        # we are running tests with a custom urlconf that
        # doesn't register the admin site.
        raise MiddlewareNotUsed()

    ignored_paths = {reverse("admin:login"), reverse("admin:logout")}

    def middleware(request):
        path = request.path
        if (
            path.startswith(admin_prefix)
            and path not in ignored_paths
            and request.user.is_authenticated
            and not is_request_user_verified(request)
        ):
            return redirect_request_to_verify(request)
        return get_response(request)

    return middleware
