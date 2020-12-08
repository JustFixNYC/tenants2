from django.core.exceptions import ImproperlyConfigured
import pytest
import docusign_esign as dse

from docusign import core
from users.models import JustfixUser


def test_create_oauth_consent_url_works(settings):
    settings.DOCUSIGN_INTEGRATION_KEY = "my_integration_key"
    url = core.create_oauth_consent_url("https://boop", "my_state")
    assert "my_state" in url
    assert "my_integration_key" in url
    assert "boop" in url
    assert "signature+impersonation" in url


def test_docusign_client_user_id_works():
    user = JustfixUser(pk=5)
    assert core.docusign_client_user_id(user) == "5"


def test_api_client_works():
    client = core.create_api_client("blarg", "foo")
    assert client.default_headers["Authorization"] == "Bearer foo"

    client = core.create_api_client("blarg", dse.OAuthToken(access_token="bar"))
    assert client.default_headers["Authorization"] == "Bearer bar"


class TestIsEnabled:
    def test_it_returns_true(self, mockdocusign):
        assert core.is_enabled() is True

    def test_it_returns_false(self):
        assert core.is_enabled() is False


class TestEnsureValidConfiguration:
    def test_it_raises_settings_error(self):
        with pytest.raises(ImproperlyConfigured, match="setting is not configured"):
            core.ensure_valid_configuration()

    def test_it_raises_private_key_error(self, mockdocusign):
        mockdocusign.private_key = ""
        mockdocusign.save()
        with pytest.raises(ImproperlyConfigured, match="private key is not configured"):
            core.ensure_valid_configuration()

    def test_it_raises_consent_code_error(self, mockdocusign):
        mockdocusign.consent_code = ""
        mockdocusign.save()
        with pytest.raises(ImproperlyConfigured, match="consent code is not configured"):
            core.ensure_valid_configuration()

    def test_it_works(self, mockdocusign):
        core.ensure_valid_configuration()


def test_get_account_base_uri_works(mockdocusign):
    assert core.get_account_base_uri("blah") == "https://fake-docusign"


def test_create_default_api_client_works(mockdocusign):
    client = core.create_default_api_client()
    assert client.host == "https://fake-docusign/restapi"
