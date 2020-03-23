import base64
import logging
import json
from django.http import FileResponse, HttpResponseForbidden, HttpResponseRedirect
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import Http404, HttpResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.utils.crypto import get_random_string

from project.util.site_util import absolute_reverse
from . import docusign
from .models import UploadToken, HPActionDocuments


LHI_B64_ALTCHARS = b' /'

SUCCESSFUL_UPLOAD_TEXT = "HP Action documents created."

DOCUSIGN_STATE = '_docusign_state'

logger = logging.getLogger(__name__)


def decode_lhi_b64_data(data: str) -> bytes:
    '''
    Law Help Interactive sends us files via POST, but
    they do it via application/x-www-form-urlencoded
    with Base64-encoded values that have '+'
    characters replaced with spaces.

    This decodes such data and returns it.
    '''

    return base64.b64decode(data, altchars=LHI_B64_ALTCHARS)


@csrf_exempt
@require_POST
def upload(request, token_str: str):
    '''
    The POST endpoint that Law Help Interactive uses to
    send us a user's HP Action documents.
    '''

    token = UploadToken.objects.find_unexpired(token_str)
    if token is None:
        raise Http404("Token does not exist")

    try:
        pdf_data = decode_lhi_b64_data(request.POST['binary_file'])
        xml_data = decode_lhi_b64_data(request.POST['answer_file'])
    except Exception as e:
        post = json.dumps(request.POST, indent=2, sort_keys=True)
        logger.error(f'Invalid POST on upload endpoint ({repr(e)}) received with data: {post}')
        return HttpResponseBadRequest("Invalid POST data")

    token.create_documents_from(xml_data=xml_data, pdf_data=pdf_data)

    return HttpResponse(SUCCESSFUL_UPLOAD_TEXT)


@login_required
def latest_pdf(request):
    return get_latest_pdf_for_user(request.user)


def get_latest_pdf_for_user(user) -> FileResponse:
    latest = HPActionDocuments.objects.get_latest_for_user(user)
    if latest is None:
        raise Http404("User has no generated HP Action documents")
    return FileResponse(latest.pdf_file.open(), filename='hp-action-forms.pdf')


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


@login_required
def docusign_callback(request):
    if not validate_and_clear_docusign_state(request):
        return HttpResponseForbidden("Invalid state")
    code = request.GET.get('code')
    if code:
        if docusign.validate_and_set_consent_code(code):
            return HttpResponse("Thank you for your consent. You may close this window.")
        return HttpResponse("Your account does not seem to have the privileges we need.")
    return HttpResponse(
        "Thanks for doing whatever you just did on DocuSign, "
        "but I'm not sure what to do now."
    )


@login_required
def docusign_consent(request):
    url = docusign.create_oauth_consent_url(
        return_url=absolute_reverse('hpaction:docusign_callback'),
        state=set_random_docusign_state(request),
    )
    return HttpResponseRedirect(url)
