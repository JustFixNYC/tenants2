from django.conf import settings
from csp.middleware import CSPMiddleware
from csp.decorators import csp_update


class CSP1CompatMiddleware(CSPMiddleware):
    '''
    TLDR: This middleware puts an 'unsafe-inline' directive
    before a nonce directive in CSP, if a nonce directive is
    in the CSP header, to ensure that CSP 1.0 browsers can
    run inline scripts.

    Here is the full explanation and rationale for this:

    Browsers that only support CSP 1.0 but not 2.0 don't support
    nonces in inline scripts. This means that CSP 1.0 browsers won't
    execute those scripts, but CSP 2.0 browsers will (and of course,
    browsers that don't support CSP at all will execute them too).

    This puts CSP 1.0 browsers in a weird minority of edge cases.
    However, we can actually support them by including an 'unsafe-inline'
    directive just before the nonce directive in our CSP header,
    as the nonce directive will override the unsafe-inline one
    for browsers that support CSP 2.0.  This effectively means that
    our CSP header will be meaningless on CSP 1.0 browsers, but this
    seems like a decent tradeoff since those browsers are
    (hopefully) in a vanishingly small percentage and inline scripts
    are important for performance.
    '''

    def process_response(self, request, response):
        nonce = getattr(request, '_csp_nonce', None)

        if nonce and 'script-src' in settings.CSP_INCLUDE_NONCE_IN:
            csp_update(SCRIPT_SRC="'unsafe-inline'")(lambda: response)()

        return super().process_response(request, response)
