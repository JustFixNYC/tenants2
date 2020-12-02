import json
from django.core.management import call_command
from graphene_django.settings import graphene_settings

from ..justfix_environment import BASE_DIR


FILENAME = "schema.json"

# This command is provided by graphene-django.
REBUILD_CMD = "graphql_schema"

REBUILD_CMDLINE = " ".join(["python", "manage.py", REBUILD_CMD])


def is_up_to_date() -> bool:
    """
    Returns whether or not our schema.json file reflects
    the latest state of our server's actual GraphQL
    schema.
    """

    repo_schema = BASE_DIR / FILENAME
    if not repo_schema.exists():
        return False
    current_schema_json = json.loads(json.dumps({"data": graphene_settings.SCHEMA.introspect()}))
    repo_schema_json = json.loads(repo_schema.read_text())
    return current_schema_json == repo_schema_json


def rebuild():
    """
    Rebuild our schema.json file.
    """

    call_command(REBUILD_CMD)


def monkeypatch_graphql_schema_command():
    """
    The default graphql_schema command writes a JSON file
    using the platform's current line endings. However, we
    store this file in version control using UNIX line endings,
    so we don't want commits from Windows systems accidentally
    changing them.

    This function monkeypatches the command to ensure that
    it always writes the JSON file using UNIX line endings.
    """

    from functools import partial
    from graphene_django.management.commands import graphql_schema

    if not hasattr(graphql_schema, "open"):
        graphql_schema.open = partial(open, newline="\n")
