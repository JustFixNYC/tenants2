import base64
import logging
import json
from django.http import FileResponse, Http404, HttpResponse, HttpResponseBadRequest
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required

from .models import UploadToken, HPActionDocuments


LHI_B64_ALTCHARS = b' /'

SUCCESSFUL_UPLOAD_TEXT = "HP Action documents created."

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
    emergency_version = request.GET.get('em') == 'on'
    return get_latest_pdf_for_user(request.user, emergency_version)


def get_latest_pdf_for_user(user, emergency_version: bool = False) -> FileResponse:
    latest = HPActionDocuments.objects.get_latest_for_user(user)
    if latest is None:
        raise Http404("User has no generated HP Action documents")
    if emergency_version:
        file_obj = latest.open_emergency_pdf_file()
        if not file_obj:
            raise Http404("Generated HP Action packet consists only of instructions")
    else:
        file_obj = latest.pdf_file.open()
    return FileResponse(file_obj, filename='hp-action-forms.pdf')
