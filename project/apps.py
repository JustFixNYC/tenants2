import logging
import sys
from django.apps import AppConfig
from django.conf import settings


logger = logging.getLogger(__name__)


def is_running_dev_server(argv=sys.argv):
    '''
    Returns whether or not we are running the development
    server, e.g.:

        >>> is_running_dev_server(['manage.py', '--help'])
        False

        >>> is_running_dev_server(['manage.py', 'runserver'])
        True
    '''

    return 'manage.py' in argv and 'runserver' in argv


class DefaultConfig(AppConfig):
    name = 'project'

    def ready(self):
        from project import twilio

        twilio.validate_settings()

        if settings.DEBUG and is_running_dev_server():
            from project.util import schema_json

            if not schema_json.is_up_to_date():
                print(f"Rebuilding {schema_json.FILENAME}...")
                schema_json.rebuild()
        else:
            logger.info(f"This is version {settings.GIT_INFO.get_version_str()}.")
