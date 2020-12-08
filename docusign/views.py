from typing import Dict, Optional
import functools
import urllib.parse
from django.conf import settings
from django.utils.module_loading import import_string
from django.utils.crypto import get_random_string
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseRedirect, Http404
from django.contrib.auth.decorators import login_required

from . import core
from project.util.site_util import absolute_reverse

DOCUSIGN_STATE = "_docusign_state"


def set_random_docusign_state(request) -> str:
    docusign_state = get_random_string(length=36)
    request.session[DOCUSIGN_STATE] = docusign_state
    return docusign_state


def validate_and_clear_docusign_state(request) -> bool:
    is_valid = False
    if DOCUSIGN_STATE in request.session:
        is_valid = request.GET.get("state") == request.session[DOCUSIGN_STATE]
        if is_valid:
            del request.session[DOCUSIGN_STATE]
    return is_valid


def docusign_enabled_only(fn):
    """
    A view decorator that only calls the decorated view if DocuSign integration
    is enabled; otherwise it 404's.
    """

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        if not core.is_enabled():
            raise Http404("DocuSign integration is disabled")
        return fn(*args, **kwargs)

    return wrapper


def append_querystring_args(url: str, args: Dict[str, str]) -> str:
    """
    >>> append_querystring_args('http://foo/', {'bar': 'hi'})
    'http://foo/?bar=hi'
    >>> append_querystring_args('http://foo/?baz=u', {'bar': 'hi'})
    'http://foo/?baz=u&bar=hi'
    """

    qs = urllib.parse.urlencode(args)
    appender = "&" if "?" in url else "?"
    return f"{url}{appender}{qs}"


def create_callback_url(request, querystring_args: Dict[str, str]) -> str:
    """
    Create a DocuSign callback URL with the given querystring arguments.
    This will set state on the given request to ensure that it
    isn't vulnerable to CSRF.

    Note, however, that as such, it should be called sparingly, since a
    subsequent call will obliterate the state set up by the first call.
    """

    state = set_random_docusign_state(request)
    return append_querystring_args(
        absolute_reverse("docusign:callback"),
        {
            "state": state,
            **querystring_args,
        },
    )


def call_callback_handlers(request) -> Optional[HttpResponse]:
    """
    Call the functions whose dotted names are defined in
    the `DOCUSIGN_CALLBACK_HANDLERS` setting until one of
    them returns a response, and return that response.

    Return None if none of them returned a response.
    """

    for dotted_path in settings.DOCUSIGN_CALLBACK_HANDLERS:
        handler = import_string(dotted_path)
        response = handler(request)
        if response:
            return response
    return None


@docusign_enabled_only
@login_required
def callback(request):
    """
    The DocuSign callback view, where users are redirected when they finish a flow
    on DocuSign's site.

    This is the app's only callback; it needs to be registered with DocuSign or they
    will refuse to redirect the user to it.

    To handle a callback, add the dotted name of a function to the
    `DOCUSIGN_CALLBACK_HANDLERS` setting; it will be passed a Django HttpRequest,
    and if it returns a HttpResponse, that will be the response of this view. It
    can also return None if it doesn't think the request applies to it.
    """

    if not validate_and_clear_docusign_state(request):
        return HttpResponseForbidden("Invalid state")

    # See if this is part of the DocuSign consent flow, in which case we'll handle
    # it ourselves.
    code = request.GET.get("code")
    if code:
        if core.validate_and_set_consent_code(code):
            return HttpResponse("Thank you for your consent. You may close this window.")
        return HttpResponse("Your account does not seem to have the privileges we need.")

    # Run the response through our call handlers, to see if one of them handles it.
    response = call_callback_handlers(request)
    if response:
        return response

    # TODO: Log an error.
    return HttpResponse(
        "Thanks for doing whatever you just did on DocuSign, " "but I'm not sure what to do now."
    )


@docusign_enabled_only
@login_required
def consent(request):
    """
    Initiate the DocuSign consent OAuth flow by redirecting the user.
    """

    url = core.create_oauth_consent_url(
        return_url=absolute_reverse("docusign:callback"),
        state=set_random_docusign_state(request),
    )
    return HttpResponseRedirect(url)
