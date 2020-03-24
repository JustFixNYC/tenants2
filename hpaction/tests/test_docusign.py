from io import StringIO
from django.core.management import call_command
from django.core.exceptions import ImproperlyConfigured
import pytest

from .factories import HPActionDocumentsFactory
from hpaction import docusign
from users.models import JustfixUser


def simpleuuid(hexbyte: str) -> str:
    uuid = '-'.join([hexbyte * 4, hexbyte * 2, hexbyte * 2, hexbyte * 2, hexbyte * 6])
    assert len(uuid) == 36
    return uuid


@pytest.fixture
def mockdocusign(db, settings):
    settings.DOCUSIGN_ACCOUNT_ID = simpleuuid('aa')
    settings.DOCUSIGN_INTEGRATION_KEY = simpleuuid('bb')
    settings.DOCUSIGN_USER_ID = simpleuuid('cc')
    cfg = docusign.get_config()
    cfg.private_key = 'fake_private_key'
    cfg.consent_code = 'fake_consent_code'
    cfg.base_uri = 'https://fake-docusign'
    cfg.save()
    yield cfg


def test_create_oauth_consent_url_works(settings):
    settings.DOCUSIGN_INTEGRATION_KEY = 'my_integration_key'
    url = docusign.create_oauth_consent_url('https://boop', 'my_state')
    assert 'my_state' in url
    assert 'my_integration_key' in url
    assert 'boop' in url
    assert 'signature+impersonation' in url


def test_setting_private_key_works(db):
    assert docusign.get_private_key_bytes() == b''
    call_command('setdocusignkey', stdin=StringIO("boop"))
    assert docusign.get_private_key_bytes() == b'boop'


def test_create_envelope_definition_for_hpa_works(db, django_file_storage):
    docs = HPActionDocumentsFactory()
    ed = docusign.create_envelope_definition_for_hpa(docs)
    assert len(ed.documents) == 1
    assert len(ed.recipients.signers) == 1


def test_docusign_client_user_id_works():
    user = JustfixUser(pk=5)
    assert docusign.docusign_client_user_id(user) == '5'


def test_api_client_works():
    client = docusign.create_api_client('blarg', 'foo')
    assert client.default_headers['Authorization'] == 'Bearer foo'


class TestIsEnabled:
    def test_it_returns_true(self, mockdocusign):
        assert docusign.is_enabled() is True

    def test_it_returns_false(self):
        assert docusign.is_enabled() is False


class TestEnsureValidConfiguration:
    def test_it_raises_settings_error(self):
        with pytest.raises(ImproperlyConfigured, match='setting is not configured'):
            docusign.ensure_valid_configuration()

    def test_it_raises_private_key_error(self, mockdocusign):
        mockdocusign.private_key = ''
        mockdocusign.save()
        with pytest.raises(ImproperlyConfigured, match='private key is not configured'):
            docusign.ensure_valid_configuration()

    def test_it_raises_consent_code_error(self, mockdocusign):
        mockdocusign.consent_code = ''
        mockdocusign.save()
        with pytest.raises(ImproperlyConfigured, match='consent code is not configured'):
            docusign.ensure_valid_configuration()

    def test_it_works(self, mockdocusign):
        docusign.ensure_valid_configuration()
