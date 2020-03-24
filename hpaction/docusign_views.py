import functools
import urllib.parse
from typing import Dict
from django.shortcuts import render
from django.utils.crypto import get_random_string
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseRedirect, Http404

from . import docusign
from .models import HPActionDocuments
from project.util.site_util import absolute_reverse

DOCUSIGN_STATE = '_docusign_state'


def set_random_docusign_state(request) -> str:
    docusign_state = get_random_string(length=36)
    request.session[DOCUSIGN_STATE] = docusign_state
    return docusign_state


def validate_and_clear_docusign_state(request) -> bool:
    is_valid = False
    if DOCUSIGN_STATE in request.session:
        is_valid = request.GET.get('state') == request.session[DOCUSIGN_STATE]
        del request.session[DOCUSIGN_STATE]
    return is_valid


def docusign_enabled_only(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        if not docusign.is_enabled():
            raise Http404("DocuSign integration is disabled")
        return fn(*args, **kwargs)
    return wrapper


@login_required
@docusign_enabled_only
def callback(request):
    '''
    The DocuSign callback view, where users are redirected when they finish a flow
    on DocuSign's site.

    This is the app's only callback; it needs to be registered with DocuSign or they
    will refuse to redirect the user to it.
    '''

    if not validate_and_clear_docusign_state(request):
        return HttpResponseForbidden("Invalid state")
    code = request.GET.get('code')
    if code:
        if docusign.validate_and_set_consent_code(code):
            return HttpResponse("Thank you for your consent. You may close this window.")
        return HttpResponse("Your account does not seem to have the privileges we need.")
    event = request.GET.get('event')
    next_url = request.GET.get('next')
    if event and next_url:
        # TODO: Validate next_url?
        next_url = append_querystring_args(next_url, {'event': event})
        return HttpResponseRedirect(next_url)
    return HttpResponse(
        "Thanks for doing whatever you just did on DocuSign, "
        "but I'm not sure what to do now."
    )


def append_querystring_args(url: str, args: Dict[str, str]) -> str:
    '''
    >>> append_querystring_args('http://foo/', {'bar': 'hi'})
    'http://foo/?bar=hi'
    >>> append_querystring_args('http://foo/?baz=u', {'bar': 'hi'})
    'http://foo/?baz=u&bar=hi'
    '''

    qs = urllib.parse.urlencode(args)
    appender = '&' if '?' in url else '?'
    return f"{url}{appender}{qs}"


def create_callback_url_for_signing_flow(request, next_url: str) -> str:
    state = set_random_docusign_state(request)
    return append_querystring_args(absolute_reverse('hpaction:docusign_callback'), {
        'state': state,
        'next': next_url,
    })


@login_required
@docusign_enabled_only
def consent(request):
    '''
    Initiate the DocuSign consent OAuth flow by redirecting the user.
    '''

    url = docusign.create_oauth_consent_url(
        return_url=absolute_reverse('hpaction:docusign_callback'),
        state=set_random_docusign_state(request),
    )
    return HttpResponseRedirect(url)


@login_required
@docusign_enabled_only
@require_POST
def sign_hpa(request):
    '''
    A *TEMPORARY* view to carry the user through the e-signing process
    for their HP Action packet.

    We'll eventually replace this view with a GraphQL
    mutation and have everything done on the React front-end.
    '''

    user = request.user
    if not user.email:
        return HttpResponse("You have no email address!")

    docs = HPActionDocuments.objects.get_latest_for_user(user)

    if not docs:
        return HttpResponse("You have no HP Action documents to sign!")

    return_url = create_callback_url_for_signing_flow(
        request,
        absolute_reverse('hpaction:docusign_index'),
    )
    envelope_definition = docusign.create_envelope_definition_for_hpa(docs)
    api_client = docusign.create_default_api_client()
    _, url = docusign.create_envelope_and_recipient_view_for_hpa(
        user=user,
        envelope_definition=envelope_definition,
        api_client=api_client,
        return_url=return_url,
    )

    return HttpResponseRedirect(url)


@login_required
@docusign_enabled_only
def index(request):
    return render(request, 'hpaction/docusign.html', {
        'event': request.GET.get('event'),
    })
