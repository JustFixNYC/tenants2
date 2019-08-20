import logging
from celery import shared_task
from django.conf import settings

from project import slack


logger = logging.getLogger(__name__)


shared_task(ignore_result=True)(slack.sendmsg)


@shared_task
def get_git_revision():
    return settings.GIT_INFO.get_version_str()


@shared_task
def raise_test_error(id: str):
    logger.error(
        f"This is an example Celery task log message with id '{id}'. "
        f"If you can read this, it means errors from the logging system "
        f"are being reported properly from Celery tasks."
    )
    raise Exception(
        f"This is an example Celery task exception with id '{id}'. "
        f"If you can read this, it means unexpected Celery task "
        f"errors are being reported properly."
    )
