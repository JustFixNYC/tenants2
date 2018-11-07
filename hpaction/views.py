import base64
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import Http404, HttpResponse

from .models import UploadToken


LHI_B64_ALTCHARS = b' /'


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

    pdf_data = decode_lhi_b64_data(request.POST['binary_file'])
    xml_data = decode_lhi_b64_data(request.POST['answer_file'])

    token.create_documents_from(xml_data=xml_data, pdf_data=pdf_data)

    return HttpResponse("HP Action documents created.")
