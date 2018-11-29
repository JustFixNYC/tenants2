from typing import Union, Optional
import logging
from django.conf import settings
import zeep

from .models import UploadToken, HPActionDocuments
from .hpactionvars import HPActionVariables
from .views import SUCCESSFUL_UPLOAD_TEXT


logger = logging.getLogger(__name__)

HDInfo = Union[str, HPActionVariables]


def hdinfo_to_str(hdinfo: HDInfo) -> str:
    if isinstance(hdinfo, HPActionVariables):
        hdinfo = str(hdinfo.to_answer_set())
    return hdinfo


def get_answers_and_documents(token: UploadToken, hdinfo: HDInfo) -> Optional[HPActionDocuments]:
    '''
    Given an upload token and HotDocs answers, call Law Help Interactive's
    GetAnswersAndDocuments SOAP endpoint, which should POST the generated
    HP Action PDF and answer file back to us. We'll then return these
    documents.

    If HP Action integration is disabled, or if a network or SOAP error occurs,
    we log an error and return None instead.
    '''

    if not settings.HP_ACTION_CUSTOMER_KEY:
        logger.error(f"HP_ACTION_CUSTOMER_KEY is not set.")
        return None

    token_id = token.id
    hdinfo_str = hdinfo_to_str(hdinfo)
    postback_url = token.get_upload_url()
    transport = zeep.transports.Transport(
        timeout=settings.HP_ACTION_TIMEOUT,
        operation_timeout=settings.HP_ACTION_TIMEOUT
    )
    client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl", transport=transport)

    try:
        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=settings.HP_ACTION_TEMPLATE_ID,
            HDInfo=hdinfo_str,
            DocID=token_id,
            PostBackUrl=postback_url
        )
    except Exception:
        logger.exception("Error occurred while calling GetAnswersAndDocuments().")
        return None

    if result != SUCCESSFUL_UPLOAD_TEXT:
        logger.error(f"Received unexpected response from GetAnswersAndDocuments(): {result}")
        return None

    return HPActionDocuments.objects.get(id=token_id)
