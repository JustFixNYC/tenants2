from pathlib import Path
from io import StringIO
from unittest.mock import patch, MagicMock
import pytest
from django.core.management import call_command, CommandError

from users.tests.factories import UserFactory
from .factories import HPActionDocumentsFactory
from ..views import SUCCESSFUL_UPLOAD_TEXT

TEST_EXTRACT_BASENAME = 'test-hp-action'
EXTRACT_BASENAME_ARGS = ['--extract-basename', TEST_EXTRACT_BASENAME]
extract_xml_path = Path(f'{TEST_EXTRACT_BASENAME}.xml')
extract_pdf_path = Path(f'{TEST_EXTRACT_BASENAME}.pdf')
extract_paths = [extract_xml_path, extract_pdf_path]


def setup():
    for path in extract_paths:
        if path.exists():
            path.unlink()


def test_it_raises_error_if_customer_key_is_undefined():
    with pytest.raises(CommandError, match='HP_ACTION_CUSTOMER_KEY is not defined'):
        call_command('hpsend', 'blarg')


@pytest.fixture
def soap_call():
    with patch('zeep.Client') as constructor_mock:
        client = MagicMock()
        constructor_mock.return_value = client
        yield client.service.GetAnswersAndDocuments


def simulate_soap_call_success(soap_call, user):
    def create_docs(DocID, **kwargs):
        HPActionDocumentsFactory.create(id=DocID, user=user)
        return SUCCESSFUL_UPLOAD_TEXT

    soap_call.side_effect = create_docs


def test_it_works(db, settings, soap_call, django_file_storage):
    settings.HP_ACTION_CUSTOMER_KEY = 'blarg'
    out = StringIO()
    user = UserFactory()
    simulate_soap_call_success(soap_call, user)
    call_command('hpsend', user.username, *EXTRACT_BASENAME_ARGS, stdout=out)
    assert 'Successfully received HP Action documents' in out.getvalue()
    assert not extract_xml_path.exists()
    assert not extract_pdf_path.exists()


def test_it_extracts_files(db, settings, soap_call, django_file_storage):
    settings.HP_ACTION_CUSTOMER_KEY = 'blarg'
    out = StringIO()
    user = UserFactory()
    simulate_soap_call_success(soap_call, user)
    call_command('hpsend', user.username, '--extract-files',
                 *EXTRACT_BASENAME_ARGS, stdout=out)
    assert 'Successfully received HP Action documents' in out.getvalue()
    assert 'Writing test-hp-action.xml.' in out.getvalue()
    assert extract_xml_path.read_text() == 'i am xml'
    assert extract_pdf_path.read_text() == 'i am pdf'


def test_it_can_send_an_explicit_file_as_input(db, settings, soap_call, django_file_storage):
    settings.HP_ACTION_CUSTOMER_KEY = 'blarg'
    out = StringIO()
    user = UserFactory()
    simulate_soap_call_success(soap_call, user)
    call_command('hpsend', user.username,
                 '--xml-input-file', __file__, *EXTRACT_BASENAME_ARGS, stdout=out)
    assert '.py as input for document assembly' in out.getvalue()


def test_it_raises_error_on_unexpected_soap_result(db, settings, soap_call):
    settings.HP_ACTION_CUSTOMER_KEY = 'blarg'
    soap_call.return_value = "oops uhoh"
    with pytest.raises(CommandError, match='oops uhoh'):
        call_command('hpsend', UserFactory().username)
