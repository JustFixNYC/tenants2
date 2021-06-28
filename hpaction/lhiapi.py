from typing import Union, Optional
import logging
from django.conf import settings
import zeep

from project.util.celery_util import threaded_fire_and_forget_task
from project.util.site_util import absolute_reverse, get_site_name
import airtable.sync
from project import slack
from .models import UploadToken, HPActionDocuments, HP_ACTION_CHOICES
from .hpactionvars import HPActionVariables
from .build_hpactionvars import user_to_hpactionvars
from .views import SUCCESSFUL_UPLOAD_TEXT


logger = logging.getLogger(__name__)

HDInfo = Union[str, HPActionVariables]


def hdinfo_to_str(hdinfo: HDInfo) -> str:
    if isinstance(hdinfo, HPActionVariables):
        hdinfo = str(hdinfo.to_answer_set())
    return hdinfo


def get_answers_and_documents(token: UploadToken, hdinfo: HDInfo) -> Optional[HPActionDocuments]:
    """
    Given an upload token and HotDocs answers, call Law Help Interactive's
    GetAnswersAndDocuments SOAP endpoint, which should POST the generated
    HP Action PDF and answer file back to us. We'll then return these
    documents.

    If HP Action integration is disabled, or if a network or SOAP error occurs,
    we log an error and return None instead.
    """

    token_id = token.id

    if not settings.HP_ACTION_CUSTOMER_KEY:
        logger.error(f"HP_ACTION_CUSTOMER_KEY is not set.")
        UploadToken.objects.set_errored(token_id)
        return None

    hdinfo_str = hdinfo_to_str(hdinfo)
    postback_url = token.get_upload_url()
    transport = zeep.transports.Transport(
        timeout=settings.HP_ACTION_TIMEOUT, operation_timeout=settings.HP_ACTION_TIMEOUT
    )
    client = zeep.Client(f"{settings.HP_ACTION_API_ENDPOINT}?wsdl", transport=transport)

    try:
        result = client.service.GetAnswersAndDocuments(
            CustomerKey=settings.HP_ACTION_CUSTOMER_KEY,
            TemplateId=settings.HP_ACTION_TEMPLATE_ID,
            HDInfo=hdinfo_str,
            DocID=token_id,
            PostBackUrl=postback_url,
        )
    except Exception:
        logger.exception("Error occurred while calling GetAnswersAndDocuments().")
        UploadToken.objects.set_errored(token_id)
        return None

    if result != SUCCESSFUL_UPLOAD_TEXT:
        logger.error(f"Received unexpected response from GetAnswersAndDocuments(): {result}")
        UploadToken.objects.set_errored(token_id)
        return None

    return HPActionDocuments.objects.get(id=token_id)


def get_answers_and_documents_and_notify(token_id: str) -> None:
    """
    Attempt to generate a user's HP Action packet, and send related notifications
    to interested parties.
    """

    token = UploadToken.objects.find_unexpired(token_id)
    assert token is not None
    user = token.user
    kind: str = token.kind
    hdinfo = user_to_hpactionvars(user, kind)
    docs = get_answers_and_documents(token, hdinfo)
    if docs is not None:
        airtable.sync.sync_user(user)
        if kind != HP_ACTION_CHOICES.EMERGENCY:
            user.send_sms_async(
                f"{get_site_name()} here! Follow this link to your completed "
                f"HP Action legal forms. You will need to print these "
                f"papers before bringing them to court! "
                f"{absolute_reverse('hpaction:latest_pdf', kwargs={'kind': docs.kind})}",
            )
            user.trigger_followup_campaign_async("HP")
        label = HP_ACTION_CHOICES.get_label(kind)
        slack.sendmsg_async(
            f"{slack.hyperlink(text=user.best_first_name, href=user.admin_url)} "
            f"has generated {label} legal forms!",
            is_safe=True,
        )


async_get_answers_and_documents_and_notify = threaded_fire_and_forget_task(
    get_answers_and_documents_and_notify
)
