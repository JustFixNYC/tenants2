from django.contrib.sites.models import Site
from django.conf import settings
from django.urls import reverse


def absolutify_url(url: str) -> str:
    '''
    If the URL is an absolute path, returns the URL prefixed with
    the current Site's protocol and host information.

    If the given URL is already absolute, returns the URL unchanged.
    '''

    if url.startswith('http://') or url.startswith('https://'):
        return url

    if not url.startswith('/'):
        raise ValueError(f"url must be an absolute path: {url}")

    protocol = 'http' if settings.DEBUG else 'https'
    host = Site.objects.get_current().domain
    return f"{protocol}://{host}{url}"


def absolute_reverse(*args, **kwargs) -> str:
    '''
    Like Django's reverse(), but ensures the URL includes protocol
    and host information for the current Site, so that it can be
    embedded in an external location, e.g. an email.
    '''

    return absolutify_url(reverse(*args, **kwargs))


def get_canonical_url(request):
    '''
    Get the canonical URL for the given request, using the current
    Site's configuration.
    '''

    return absolutify_url(request.get_full_path())


def get_site_name() -> str:
    '''
    Returns the site name. Note that this doesn't actually look at
    Django's current Site object, but rather assumes that we're
    JustFix.nyc and appends any optional deployment information
    to it, to ensure that people don't confuse it with production.
    '''

    words = ["JustFix.nyc"]

    if settings.NAVBAR_LABEL:
        words.append(settings.NAVBAR_LABEL)

    return ' '.join(words)
