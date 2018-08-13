import json
from graphene_django.settings import graphene_settings

from ..justfix_environment import BASE_DIR


FILENAME = 'schema.json'

REBUILD_ARGS = [
    'graphql_schema',
    '--indent',
    '2',
]

REBUILD_CMDLINE = ' '.join(['python', 'manage.py'] + REBUILD_ARGS)


def is_up_to_date() -> bool:
    repo_schema = BASE_DIR / FILENAME
    current_schema_json = json.loads(json.dumps({
        'data': graphene_settings.SCHEMA.introspect()
    }))
    repo_schema_json = json.loads(repo_schema.read_text())
    return current_schema_json == repo_schema_json
