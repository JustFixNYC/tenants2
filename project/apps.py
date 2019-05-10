import logging
import sys
from django.apps import AppConfig
from django.conf import settings
from django.contrib.admin.apps import AdminConfig

from project.util.settings_util import ensure_dependent_settings_are_nonempty


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
        from project.util import schema_json

        schema_json.monkeypatch_graphql_schema_command()

        ensure_dependent_settings_are_nonempty(
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_STORAGE_BUCKET_NAME'
        )

        if settings.DEBUG and is_running_dev_server():
            if not schema_json.is_up_to_date():
                print(f"Rebuilding {schema_json.FILENAME}...")
                schema_json.rebuild()
        else:
            logger.info(f"This is version {settings.GIT_INFO.get_version_str()}.")


class JustfixAdminConfig(AdminConfig):
    default_site = 'project.admin.JustfixAdminSite'
