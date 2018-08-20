from pathlib import Path
from graphene.test import Client
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from django.contrib.sessions.middleware import SessionMiddleware
import subprocess
import pytest

from project.schema import schema


BASE_DIR = Path(__file__).parent.resolve()

STATICFILES_DIR = BASE_DIR / 'staticfiles'


@pytest.fixture(scope="session")
def staticfiles() -> Path:
    '''
    This test fixture ensures that 'manage.py collectstatic' has been run
    by the time the test using it executes. It returns the location of
    the staticfiles directory (which should be the same as
    settings.STATIC_ROOT).
    '''

    subprocess.check_call([
        'python', 'manage.py', 'collectstatic', '--noinput'
    ], cwd=BASE_DIR)
    assert STATICFILES_DIR.exists()
    return STATICFILES_DIR


@pytest.fixture
def graphql_client() -> Client:
    '''
    This test fixture returns a Graphene test client that can be
    used for GraphQL-related tests. For more information on the
    test client API, see:

        http://docs.graphene-python.org/en/latest/testing/
    '''

    # The following was helpful in writing this:
    # https://github.com/graphql-python/graphene-django/issues/337

    req = RequestFactory().get('/')
    req.user = AnonymousUser()
    SessionMiddleware().process_request(req)
    client = Client(schema, context_value=req)

    # Attach the request to the client for easy retrieval/alteration.
    client.request = req

    return client
