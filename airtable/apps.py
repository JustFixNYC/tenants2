import logging
from django.apps import AppConfig

from project.util.settings_util import ensure_dependent_settings_are_nonempty


logger = logging.getLogger(__name__)


def validate_settings():
    """
    Ensure that the Airtable-related settings are defined properly.
    """

    ensure_dependent_settings_are_nonempty(
        "AIRTABLE_URL",
        "AIRTABLE_API_KEY",
    )


class AirtableConfig(AppConfig):
    name = "airtable"

    def ready(self):
        validate_settings()
