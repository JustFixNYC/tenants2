import logging
from django.conf import settings


logger = logging.getLogger(__name__)


def is_not_demo_deployment(description: str) -> bool:
    """
    This function returns whether we're not on a demo deployment. It's
    intended for use in a conditional that guards actions only intended
    for execution on full production deployments.

    If it returns false, it also logs a message of the form
    `DEMO SITE NOTE: Not {description} (but this would occur in production)`,
    so that developers know why something they may have expected to happen
    didn't actually happen.
    """

    if not settings.IS_DEMO_DEPLOYMENT:
        return True
    logger.info(f"DEMO SITE NOTE: Not {description} (but this would occur in production).")
    return False
