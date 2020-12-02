import json
import requests
import logging
from typing import Dict, Any
from django.conf import settings

from project.util.celery_util import fire_and_forget_task


logger = logging.getLogger(__name__)


def post_to_webhook(payload: Dict[str, str]):
    res = requests.post(
        settings.SLACK_WEBHOOK_URL,
        data={"payload": json.dumps(payload)},
        timeout=settings.SLACK_TIMEOUT,
    )
    res.raise_for_status()


def escape(text: str) -> str:
    """
    Escape the given text as per Slack's guidelines:

        https://api.slack.com/docs/message-formatting#how_to_escape_characters

    Example:

        >>> escape('We just need to escape &, <, and >.')
        'We just need to escape &amp;, &lt;, and &gt;.'
    """

    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def send_payload(payload: Dict[str, Any]) -> bool:
    """
    Sends the given payload to Slack, as described by
    https://api.slack.com/incoming-webhooks.

    This function will log any exceptions that occur due to network
    errors, and will not re-raise them. Thus it can safely be
    used without having to worry about taking down the whole app if
    Slack happens to be down.

    Returns True if the payload was successfully sent, False otherwise.
    """

    if settings.SLACK_WEBHOOK_URL:
        try:
            post_to_webhook(payload)
            return True
        except Exception:
            logger.exception("Error occurred when sending Slack message.")
    else:
        logger.debug("SLACK_WEBHOOK_URL is empty; not sending message.")

    return False


def sendmsg(text: str, is_safe=False) -> bool:
    """
    Sends a message to Slack with the given text, formatted in the
    style described at https://api.slack.com/incoming-webhooks. It
    will automatically be escaped unless is_safe is True.

    Returns True if the message was successfully sent, False otherwise.
    """

    if not is_safe:
        text = escape(text)
    return send_payload({"text": text})


def hyperlink(href: str, text: str) -> str:
    """
    Returns a pre-escaped hyperlink for Slack messages, e.g.:

        >>> hyperlink(text="hi", href="http://boop.com")
        '<http://boop.com|hi>'
    """

    return f"<{escape(href)}|{escape(text)}>"


sendmsg_async = fire_and_forget_task(sendmsg)
