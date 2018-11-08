from io import StringIO
from unittest.mock import patch, MagicMock
import pytest
from django.core.management import call_command, CommandError

from users.tests.factories import UserFactory
from ..views import SUCCESSFUL_UPLOAD_TEXT


def test_it_raises_error_if_customer_key_is_undefined():
    with pytest.raises(CommandError, match='HP_ACTION_CUSTOMER_KEY is not defined'):
        call_command('hpsend', 'blarg')


@pytest.fixture
def soap_call():
    with patch('zeep.Client') as constructor_mock:
        client = MagicMock()
        constructor_mock.return_value = client
        yield client.service.GetAnswersAndDocuments


def test_it_works(db, settings, soap_call):
    settings.HP_ACTION_CUSTOMER_KEY = 'blarg'
    out = StringIO()
    soap_call.return_value = SUCCESSFUL_UPLOAD_TEXT
    call_command('hpsend', UserFactory().username, stdout=out)
    assert 'Successfully received HP Action documents' in out.getvalue()


def test_it_raises_error_on_unexpected_soap_result(db, settings, soap_call):
    settings.HP_ACTION_CUSTOMER_KEY = 'blarg'
    soap_call.return_value = "oops uhoh"
    with pytest.raises(CommandError, match='oops uhoh'):
        call_command('hpsend', UserFactory().username)
