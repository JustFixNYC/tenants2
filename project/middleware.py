import base64
from functools import partial
from hashlib import sha256
from typing import Dict, List, Union
from django.conf import settings
from django.http import HttpResponseRedirect
from csp.middleware import CSPMiddleware

from project.util.site_util import get_protocol
from . import monkeypatch_rollbar


CspUpdateDict = Dict[str, Union[str, List[str]]]
SimpleCspUpdateDict = Dict[str, List[str]]


def to_str_list(value: Union[str, List[str]]) -> List[str]:
    if isinstance(value, str):
        return [value]
    return value


class CSPHashingMiddleware(CSPMiddleware):
    '''
    This adds supprt for CSP 2.0 inline script hashes, while
    also maintaining compatibility with CSP 1.0.

    To use it, call the `allow_inline_script` method on a
    Django HttpRequest, passing it the contents of the
    inline script (not including the script tags themselves),
    e.g.:

        request.allow_inline_script('console.log("hi");')

    Your HttpResponse can then include an inline script
    with that content, and it will be run on all browsers.

    Additionally, the 'csp_update' method is available on
    requests, which allows CSP updates to be made, e.g.:

        request.csp_update(SCRIPT_SRC='https://blah.com')

    Notes on CSP 1.0 support
    ------------------------

    This middleware supports CSP 1.0 browsers by effectively
    *disabling CSP* on them: that is, it puts an 'unsafe-inline'
    directive before hash directives in CSP to ensure that
    CSP 1.0 browsers can run the inline scripts.

    Here is the full explanation and rationale for this:

    Browsers that only support CSP 1.0 but not 2.0 don't support
    hashes in inline scripts. This means that CSP 1.0 browsers won't
    execute those scripts, but CSP 2.0 browsers will (and of course,
    browsers that don't support CSP at all will execute them too).

    This puts CSP 1.0 browsers in a weird minority of edge cases.
    However, we can actually support them by including an 'unsafe-inline'
    directive just before the hash directive in our CSP header,
    as the hash directive will override the unsafe-inline one
    for browsers that support CSP 2.0.  This effectively means that
    our CSP header will be meaningless on CSP 1.0 browsers, but this
    seems like a decent tradeoff since those browsers are
    (hopefully) in a vanishingly small percentage and inline scripts
    are important for performance.
    '''

    def _allow_inline_script(self, request, content):
        m = sha256()
        m.update(content.encode('utf-8'))
        b64hash = base64.b64encode(m.digest()).decode('ascii')
        hashval = f"'sha256-{b64hash}'"
        prev = getattr(request, '_csp_script_hashes', [])
        setattr(request, '_csp_script_hashes', prev + [hashval])

    def _csp_update(self, request, **kwargs):
        update = dict((k.lower().replace('_', '-'), v) for k, v in kwargs.items())
        prev = getattr(request, '_csp_updates', [])
        setattr(request, '_csp_updates', prev + [update])

    def process_request(self, request):
        super().process_request(request)
        allow_inline_script = partial(self._allow_inline_script, request)
        request.allow_inline_script = allow_inline_script
        request.csp_update = partial(self._csp_update, request)

    def _merge_csp_updates(self, csp_updates: List[CspUpdateDict]) -> SimpleCspUpdateDict:
        result: SimpleCspUpdateDict = {}

        for update in csp_updates:
            for key, value in update.items():
                result[key] = result.get(key, ["'self'"]) + to_str_list(value)

        return result

    def process_response(self, request, response):
        script_hashes: List[str] = getattr(request, '_csp_script_hashes', [])
        csp_updates: List[CspUpdateDict] = getattr(
            request, '_csp_updates', [])
        response_csp_update: CspUpdateDict = getattr(
            response, '_csp_update', {})

        csp_updates.append(response_csp_update)

        if script_hashes:
            csp_updates.append({'script-src': ["'unsafe-inline'"] + script_hashes})

        setattr(response, '_csp_update', self._merge_csp_updates(csp_updates))

        return super().process_response(request, response)


def hostname_redirect_middleware(get_response):
    '''
    Middleware to redirect access to any of the domains specified
    by the keys in settings.HOSTNAME_REDIRECTS to their corresponding
    values. Preserves the full path of the URL.

    For example, if settings.HOSTNAME_REDIRECTS is {'foo.com': 'bar.com'},
    then any accesses to http://foo.com/blah will be redirected to
    http://bar.com/blah.
    '''

    def middleware(request):
        host = request.get_host()
        if host in settings.HOSTNAME_REDIRECTS:
            new_host = settings.HOSTNAME_REDIRECTS[host]
            path = request.get_full_path()
            return HttpResponseRedirect(f'{get_protocol()}://{new_host}{path}')
        return get_response(request)

    return middleware


def rollbar_request_middleware(get_response):
    '''
    For the duration of the current request, hold it in
    thread-local storage so Rollbar can access it when
    reporting.
    '''

    def middleware(request):
        with monkeypatch_rollbar.set_current_rollbar_request(request):
            response = get_response(request)
        return response

    return middleware
