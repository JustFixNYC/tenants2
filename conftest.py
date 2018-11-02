from pathlib import Path
from dataclasses import dataclass
from typing import List, Iterator
from unittest.mock import patch
from graphene.test import Client
from django.test import RequestFactory
from django.test.client import Client as DjangoClient
from django.core.management import call_command
from django.contrib.auth.models import AnonymousUser, Group
from django.contrib.sessions.middleware import SessionMiddleware
import subprocess
import pytest

from users.tests.factories import UserFactory
from project.schema import schema
from nycha.tests.fixtures import load_nycha_csv_data


BASE_DIR = Path(__file__).parent.resolve()

STATICFILES_DIR = BASE_DIR / 'staticfiles'


@pytest.fixture(scope="session")
def loaded_nycha_csv_data(django_db_setup, django_db_blocker):
    '''
    Load example NYCHA office/property data into the database.
    '''

    with django_db_blocker.unblock():
        yield load_nycha_csv_data()


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


class TestGraphQLClient(Client):
    '''
    A subclass of the Graphene test client that, by default, ensures
    that there are no errors in the GraphQL response, i.e. that no
    exceptions were thrown during the execution of a request.

    If exceptions were thrown, they will have been logged, and py.test will
    show them.
    '''

    def execute(self, *args, **kwargs):
        result = super().execute(*args, **kwargs)
        assert 'errors' not in result
        return result


@pytest.fixture
def graphql_client() -> TestGraphQLClient:
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
    client = TestGraphQLClient(schema, context_value=req)

    # Attach the request to the client for easy retrieval/alteration.
    client.request = req

    return client


@dataclass
class FakeSmsMessage:
    to: str
    from_: str
    body: str
    sid: str


@dataclass
class FakeSmsCreateResult:
    sid: str


@pytest.fixture
def smsoutbox(settings) -> Iterator[List[FakeSmsMessage]]:
    '''
    This is like pytest-django's built-in 'mailoutbox'
    fixture, only for SMS messages.
    '''

    settings.TWILIO_ACCOUNT_SID = 'test account sid'
    settings.TWILIO_AUTH_TOKEN = 'test auth token'
    settings.TWILIO_PHONE_NUMBER = '0001234567'

    outbox: List[FakeSmsMessage] = []

    class FakeTwilioClient():
        def __init__(self, account_sid, auth_token, http_client):
            pass

        @property
        def messages(self):
            return self

        def create(self, to: str, from_: str, body: str):
            sid = 'blarg'
            outbox.append(FakeSmsMessage(
                to=to,
                from_=from_,
                body=body,
                sid=sid
            ))
            return FakeSmsCreateResult(sid=sid)

    with patch('texting.twilio.Client', FakeTwilioClient):
        yield outbox


@pytest.fixture
def initgroups(db):
    '''
    Ensures the test runs with the "manage.py initgroups"
    command having run.
    '''

    call_command('initgroups')


@pytest.fixture
def outreach_user(initgroups):
    '''
    Returns a user that is in the Outreach Coordinators group.
    '''

    user = UserFactory(
        username='outreacher',
        phone_number='1234567000',
        is_staff=True)
    group = Group.objects.get(name='Outreach Coordinators')
    user.groups.add(group)
    return user


@pytest.fixture
def outreach_client(outreach_user):
    '''
    Returns a Django test client with a logged-in Outreach
    Coordinator.
    '''

    client = DjangoClient()
    client.force_login(outreach_user)
    return client
