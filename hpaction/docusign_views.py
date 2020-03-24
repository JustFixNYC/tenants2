from django.shortcuts import render

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.http import HttpResponse, HttpResponseRedirect

from . import docusign
from .models import HPActionDocuments
from docusign.views import (
    docusign_enabled_only,
    create_callback_url_for_signing_flow,
)
from docusign.core import create_default_api_client
from project.util.site_util import absolute_reverse


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
    api_client = create_default_api_client()
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
