from django.test import override_settings
import pytest

from users.tests.factories import UserFactory
from .factories import UploadTokenFactory
from hpaction.models import get_upload_status_for_user, HPUploadStatus
import hpaction.schema


def execute_genpdf_mutation(graphql_client, **input):
    return graphql_client.execute(
        """
        mutation MyMutation($input: GeneratePDFInput!) {
            output: generateHpActionPdf(input: $input) {
                errors { field, messages }
                session { latestHpActionPdfUrl }
            }
        }
        """,
        variables={'input': input}
    )['data']['output']


class TestGenerateHPActionPDF:
    def setup(self):
        self._orig_async = hpaction.schema.GET_ANSWERS_AND_DOCUMENTS_ASYNC
        hpaction.schema.GET_ANSWERS_AND_DOCUMENTS_ASYNC = False

    def teardown(self):
        hpaction.schema.GET_ANSWERS_AND_DOCUMENTS_ASYNC = self._orig_async

    def test_it_requires_auth(self, graphql_client):
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == [{'field': '__all__', 'messages': [
            'You do not have permission to use this form!'
        ]}]

    @pytest.mark.django_db
    def test_it_errors_if_hpaction_is_disabled(self, graphql_client):
        user = UserFactory.create()
        graphql_client.request.user = user
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == []
        assert get_upload_status_for_user(user) == HPUploadStatus.ERRORED

    @pytest.mark.django_db
    @override_settings(HP_ACTION_CUSTOMER_KEY="boop")
    def test_it_works(self, graphql_client, fake_soap_call, django_file_storage):
        user = UserFactory.create()
        graphql_client.request.user = user
        fake_soap_call.simulate_success(user)
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == []
        assert get_upload_status_for_user(user) == HPUploadStatus.SUCCEEDED


class TestSessionInfo:
    def execute(self, graphql_client):
        return graphql_client.execute(
            'query { session { latestHpActionPdfUrl, hpActionUploadStatus } }'
        )['data']['session']

    def test_it_works_if_unauthenticated(self, graphql_client):
        assert self.execute(graphql_client) == {
            'latestHpActionPdfUrl': None,
            'hpActionUploadStatus': 'NOT_STARTED'
        }

    @pytest.mark.django_db
    def test_it_works_if_logged_in_but_not_started(self, graphql_client):
        graphql_client.request.user = UserFactory.create()
        assert self.execute(graphql_client) == {
            'latestHpActionPdfUrl': None,
            'hpActionUploadStatus': 'NOT_STARTED'
        }

    @pytest.mark.django_db
    def test_it_works_if_started(self, graphql_client):
        tok = UploadTokenFactory()
        graphql_client.request.user = tok.user
        assert self.execute(graphql_client) == {
            'latestHpActionPdfUrl': None,
            'hpActionUploadStatus': 'STARTED'
        }
