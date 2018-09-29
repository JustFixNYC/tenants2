import logging
from django.apps import AppConfig
from django.conf import settings


logger = logging.getLogger(__name__)


class DefaultConfig(AppConfig):
    name = 'project'

    def ready(self):
        if settings.DEBUG:
            from project.util import schema_json

            if not schema_json.is_up_to_date():
                print(f"Rebuilding {schema_json.FILENAME}...")
                schema_json.rebuild()
        else:
            logger.info(f"This is version {settings.GIT_INFO.get_version_str()}.")
