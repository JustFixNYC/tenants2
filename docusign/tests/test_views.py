import pytest
import urllib.parse
from django.urls import reverse_lazy

from users.tests.factories import UserFactory
from docusign import core
from docusign.views import (
    DOCUSIGN_STATE, callback, create_callback_url_for_signing_flow,
    set_random_docusign_state, validate_and_clear_docusign_state)


CALLBACK_URL = reverse_lazy('docusign:callback')
CONSENT_URL = reverse_lazy('docusign:consent')
URLS = [CALLBACK_URL, CONSENT_URL]


@pytest.mark.parametrize('url', URLS)
def test_views_404_when_docusign_is_disabled(url, client):
    assert client.get(url).status_code == 404


@pytest.mark.parametrize('url', URLS)
def test_views_require_auth_when_docusign_is_enabled(url, client, mockdocusign):
    assert client.get(url).status_code == 302


def test_callback_returns_403_on_invalid_state(admin_client, mockdocusign):
    assert admin_client.get(CALLBACK_URL).status_code == 403


def test_consent_flow_works(admin_client, mockdocusign):
    res = admin_client.get(CONSENT_URL)
    assert res.status_code == 302
    assert 'response_type=code' in res['Location']
    state = urllib.parse.parse_qs(res['Location'])['state'][0]
    code = "noice"
    res = admin_client.get(f"{CALLBACK_URL}?code={code}&state={state}")
    assert res.status_code == 200
    assert b"Thank you for your consent" in res.content
    assert core.get_config().consent_code == code


def test_callback_redirects_on_event(http_request, mockdocusign):
    http_request.user = UserFactory()
    http_request.session[DOCUSIGN_STATE] = 'blarp'
    http_request.GET = {'state': 'blarp', 'event': 'signing_complete', 'next': 'https://boop/?a=1'}
    res = callback(http_request)
    assert res.status_code == 302
    assert res['Location'] == 'https://boop/?a=1&event=signing_complete'


def test_callback_returns_200_on_unknown_args(http_request, mockdocusign):
    http_request.user = UserFactory()
    http_request.session[DOCUSIGN_STATE] = 'blarp'
    http_request.GET = {'state': 'blarp'}
    res = callback(http_request)
    assert res.status_code == 200
    assert b"I'm not sure what to do now" in res.content


def test_create_callback_url_for_signing_flow_works(db, http_request):
    url = create_callback_url_for_signing_flow(http_request, 'https://boop/')
    assert 'callback' in url
    assert 'next=https' in url
    assert 'state=' in url
    assert http_request.session[DOCUSIGN_STATE] is not None


def test_setting_and_validating_docusign_state_works(db, http_request):
    assert validate_and_clear_docusign_state(http_request) is False

    set_random_docusign_state(http_request)
    assert validate_and_clear_docusign_state(http_request) is False

    state = http_request.session[DOCUSIGN_STATE]
    http_request.GET = {'state': state}
    assert validate_and_clear_docusign_state(http_request) is True

    assert DOCUSIGN_STATE not in http_request.session
