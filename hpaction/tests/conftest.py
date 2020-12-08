import pytest
from unittest.mock import patch, MagicMock

from .factories import HPActionDocumentsFactory
from ..views import SUCCESSFUL_UPLOAD_TEXT


class FakeSOAPCall:
    def __init__(self):
        self.mock_client = MagicMock()
        self.mock = self.mock_client.service.GetAnswersAndDocuments

    def simulate_success(self, user):
        def create_docs(DocID, **kwargs):
            HPActionDocumentsFactory.create(id=DocID, user=user)
            return SUCCESSFUL_UPLOAD_TEXT

        self.mock.side_effect = create_docs


@pytest.fixture
def fake_soap_call():
    with patch("zeep.Client") as constructor_mock:
        call = FakeSOAPCall()
        constructor_mock.return_value = call.mock_client
        yield call
