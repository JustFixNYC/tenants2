import json
from pathlib import Path
from django.contrib.auth.models import User
from django.core.management import call_command


def test_hello_works_when_logged_out(graphql_client):
    result = graphql_client.execute('query { hello(thing: "BLARG") }')
    assert result['data']['hello'] == \
        'Hello from GraphQL! You passed in "BLARG" and are not logged in'


def test_hello_works_when_logged_in(graphql_client):
    graphql_client.request.user = User()
    result = graphql_client.execute('query { hello(thing: "U") }')
    assert result['data']['hello'] == 'Hello from GraphQL! You passed in "U" and are logged in'


def test_there_works(graphql_client):
    result = graphql_client.execute('query { there }')
    assert result['data']['there'] == 123


def test_schema_json_is_up_to_date():
    repo_schema = Path('schema.json')
    current_schema = Path('current_schema.json')
    call_command('graphql_schema', '--indent', '2', '--out', str(current_schema))

    try:
        current_schema_json = json.loads(current_schema.read_text())
        repo_schema_json = json.loads(repo_schema.read_text())
        try:
            assert current_schema_json == repo_schema_json
        except AssertionError:
            raise Exception(
                f'{repo_schema} is out of date! '
                f'Please run "python manage.py graphql_schema --indent 2" to rebuild it.'
            )
    finally:
        current_schema.unlink()
