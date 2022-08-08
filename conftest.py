import re
import json
from pathlib import Path
from dataclasses import dataclass
from typing import List, Iterator
from unittest.mock import patch
from graphene.test import Client
from django.http import HttpRequest
from django.test.client import Client as DjangoClient
from django.core.management import call_command
from django.contrib.auth.models import AnonymousUser, Group
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.sites.models import Site
import subprocess
import pytest
import requests_mock as requests_mock_module

from users.tests.factories import UserFactory
from project.schema import schema
from nycha.tests.fixtures import load_nycha_csv_data


BASE_DIR = Path(__file__).parent.resolve()

STATICFILES_DIR = BASE_DIR / "staticfiles"


@pytest.fixture
def django_file_storage(settings):
    """
    A test fixture that can be used to store any
    files stored via Django's file storage backend
    into a temporary directory. The directory
    is cleaned up at the end of the test.
    """

    from project.tests.storage_fixture import django_file_storage

    yield from django_file_storage(settings)


@pytest.fixture(scope="session")
def loaded_nycha_csv_data(django_db_setup, django_db_blocker):
    """
    Load example NYCHA office/property data into the database.
    """

    with django_db_blocker.unblock():
        yield load_nycha_csv_data()


@pytest.fixture(scope="session")
def staticfiles() -> Path:
    """
    This test fixture ensures that 'manage.py collectstatic' has been run
    by the time the test using it executes. It returns the location of
    the staticfiles directory (which should be the same as
    settings.STATIC_ROOT).
    """

    subprocess.check_call(["python", "manage.py", "collectstatic", "--noinput"], cwd=BASE_DIR)
    assert STATICFILES_DIR.exists()
    return STATICFILES_DIR


class TestGraphQLClient(Client):
    """
    A subclass of the Graphene test client that, by default, ensures
    that there are no errors in the GraphQL response, i.e. that no
    exceptions were thrown during the execution of a request.

    If exceptions were thrown, they will have been logged, and py.test will
    show them.
    """

    def execute(self, *args, **kwargs):
        result = super().execute(*args, **kwargs)

        # By default, Graphene returns OrderedDict instances, which
        # pytest provides very hard-to-read diffs for if assertions fail.
        # Since we never rely on the ordered nature of the dicts anyways,
        # we'll just convert them to standard dicts to make test failure
        # output easier to read.
        result = json.loads(json.dumps(result))

        assert "errors" not in result
        return result


@pytest.fixture
def http_request(rf) -> HttpRequest:
    """
    Return a Django HttpRequest suitable for testing.
    """

    req = rf.get("/")
    req.user = AnonymousUser()
    SessionMiddleware(lambda request: None).process_request(req)

    return req


@pytest.fixture
@pytest.mark.django_db
def graphql_client(http_request) -> TestGraphQLClient:
    """
    This test fixture returns a Graphene test client that can be
    used for GraphQL-related tests. For more information on the
    test client API, see:

        http://docs.graphene-python.org/en/latest/testing/

    Note that this fixture requires the Django database fixture; strictly
    speaking, it actually doesn't require a db, but in practice
    almost all our GraphQL endpoints *do* rely on the db, and for
    some reason testing those endpoints without the database
    fixture unhelpfully hangs the test client (instead of throwing a helpful
    exception, which is what usually happens). So we're just going to
    *always* use the db fixture to prevent unhelpful hanging.
    """

    # The following was helpful in writing this:
    # https://github.com/graphql-python/graphene-django/issues/337

    client = TestGraphQLClient(schema, context=http_request)

    # Attach the request to the client for easy retrieval/alteration.
    client.request = http_request

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
    """
    This is like pytest-django's built-in 'mailoutbox'
    fixture, only for SMS messages.
    """

    settings.TWILIO_ACCOUNT_SID = "test account sid"
    settings.TWILIO_AUTH_TOKEN = "test auth token"
    settings.TWILIO_PHONE_NUMBER = "0001234567"

    outbox: List[FakeSmsMessage] = []

    class FakeTwilioClient:
        def __init__(self, account_sid, auth_token, http_client):
            pass

        @property
        def messages(self):
            return self

        def create(self, to: str, from_: str, body: str):
            sid = "blarg"
            outbox.append(FakeSmsMessage(to=to, from_=from_, body=body, sid=sid))
            return FakeSmsCreateResult(sid=sid)

    with patch("texting.twilio.Client", FakeTwilioClient):
        yield outbox


@pytest.fixture
def initgroups(db):
    """
    Ensures the test runs with the "manage.py initgroups"
    command having run.
    """

    call_command("initgroups")


@pytest.fixture
def outreach_user(initgroups):
    """
    Returns a user that is in the Outreach Coordinators group.
    """

    user = UserFactory(
        username="outreacher",
        phone_number="1234567000",
        first_name="Adalky",
        last_name="Superawesome",
        is_staff=True,
    )
    group = Group.objects.get(name="Outreach Coordinators")
    user.groups.add(group)
    return user


@pytest.fixture
def outreach_client(outreach_user):
    """
    Returns a Django test client with a logged-in Outreach
    Coordinator.
    """

    client = DjangoClient()
    client.force_login(outreach_user)
    return client


@pytest.fixture
def nycdb(db, settings):
    """
    Enable NYCDB integration, setting the NYCDB database to
    the default database.
    """

    settings.NYCDB_DATABASE = "default"

    from nycdb.tests.test_models import fixtures

    yield fixtures


@pytest.fixture(autouse=True)
def ensure_no_network_access(requests_mock):
    """
    Our tests prohibit network access from the `requests` module
    by default to ensure that no real HTTP requests are accidentally
    made by any suites, as this would massively slow down testing.

    We do this by forcing the use of the `requests_mock` fixture.
    If any accidental network access is made, a helpful exception
    will be raised.

    If real HTTP requests are needed, a test can explicitly whitelist
    them via request_mock's `real_http` feature:

    https://requests-mock.readthedocs.io/en/latest/mocker.html#real-http-requests
    """

    pass


@pytest.fixture
def live_server(live_server, requests_mock):
    """
    Override the default `live_server` fixture to cooperate with our
    autoused `ensure_no_network_access` fixture by white-listing network access
    to the live server.
    """

    regex = re.compile("^" + re.escape(live_server.url) + ".*")
    requests_mock.register_uri(requests_mock_module.ANY, regex, real_http=True)
    return live_server


@pytest.fixture
def disable_locale_middleware(settings):
    """
    Disable locale redirection middleware. Useful if we want to test that
    certain views actually 404.
    """

    settings.MIDDLEWARE = [
        middleware
        for middleware in settings.MIDDLEWARE
        if middleware != "django.middleware.locale.LocaleMiddleware"
    ]


@pytest.fixture
def allow_lambda_http(requests_mock):
    """
    If we're using the lambda HTTP server, pass-through requests
    to it, instead of doing any mocking.
    """

    from frontend.views import lambda_service
    from project.util.lambda_http_client import LambdaHttpClient

    if isinstance(lambda_service, LambdaHttpClient):
        requests_mock.register_uri("POST", lambda_service.get_url(), real_http=True)


@pytest.fixture
def mockdocusign(db, settings, monkeypatch):
    """
    Provide a mock DocuSign API.
    """

    from docusign.tests.docusign_fixture import mockdocusign

    yield from mockdocusign(db, settings, monkeypatch)


@pytest.fixture
def use_norent_site(db):
    """
    Set the default site as being the NoRent.org site.
    """

    site = Site.objects.get(pk=1)
    site.name = "NoRent.org"
    site.save()


@pytest.fixture
def use_evictionfree_site(db):
    """
    Set the default site as being the EvictionFreeNY.org site.
    """

    site = Site.objects.get(pk=1)
    site.name = "EvictionFreeNY.org"
    site.save()


@pytest.fixture
def use_laletterbuilder_site(db):
    """
    Set the default site as being the LaLetterBuilder site.
    """

    site = Site.objects.get(pk=1)
    site.name = "LaTenants.org"
    site.save()


@pytest.fixture
def mocklob(settings, requests_mock):
    """
    Enable Lob integration and provide mocks to simulate Lob functionality.
    """

    from loc.tests.lob_fixture import mocklob

    yield from mocklob(settings, requests_mock)
