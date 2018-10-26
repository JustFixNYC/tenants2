import json
from django.core.management import call_command
from graphene_django.settings import graphene_settings

from ..justfix_environment import BASE_DIR


FILENAME = 'schema.json'

REBUILD_CMD = 'graphql_schema'

REBUILD_CMDLINE = ' '.join(['python', 'manage.py', REBUILD_CMD])


def is_up_to_date() -> bool:
    repo_schema = BASE_DIR / FILENAME
    current_schema_json = json.loads(json.dumps({
        'data': graphene_settings.SCHEMA.introspect()
    }))
    repo_schema_json = json.loads(repo_schema.read_text())
    return current_schema_json == repo_schema_json


def rebuild():
    call_command(REBUILD_CMD)
