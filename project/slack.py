import json
import requests
import logging
from typing import Dict
from django.conf import settings


logger = logging.getLogger(__name__)


def post_to_webhook(payload: Dict[str, str]):
    res = requests.post(
        settings.SLACK_WEBHOOK_URL,
        data={'payload': json.dumps(payload)},
        timeout=settings.SLACK_TIMEOUT)
    res.raise_for_status()


def sendmsg(text: str) -> bool:
    '''
    Sends a message to Slack with the given text, formatted in the
    style described at https://api.slack.com/incoming-webhooks.

    This function will log any exceptions that occur due to network
    errors, and will not re-raise them. Thus it can safely be
    used without having to worry about taking down the whole app if
    Slack happens to be down.

    Returns True if the message was successfully sent, False otherwise.
    '''

    if settings.SLACK_WEBHOOK_URL:
        payload = {
            'text': text,
        }
        try:
            post_to_webhook(payload)
            return True
        except Exception:
            logger.exception('Error occurred when sending Slack message.')
    else:
        logger.debug('SLACK_WEBHOOK_URL is empty; not sending message.')

    return False
