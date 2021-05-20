import functools
from django.http import Http404
from django.conf import settings


def require_enabled_dashboard(view):
    @functools.wraps(view)
    def wrapped_view(*args, **kwargs):
        if not settings.DASHBOARD_DB_ALIAS:
            raise Http404()
        return view(*args, **kwargs)

    return wrapped_view


def get_django_admin_dashboard_urls(site):
    import django_sql_dashboard.urls
    from django.urls.resolvers import URLPattern

    urlpatterns = [
        URLPattern(
            pattern=pattern.pattern,
            callback=require_enabled_dashboard(site.admin_view(pattern.callback)),
            default_args=pattern.default_args,
            name=pattern.name,
        )
        for pattern in django_sql_dashboard.urls.urlpatterns
    ]

    return (urlpatterns, "", "")
