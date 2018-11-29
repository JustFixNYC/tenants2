from users.tests.factories import UserFactory


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
    def test_it_requires_auth(self, graphql_client):
        result = execute_genpdf_mutation(graphql_client)
        assert result['errors'] == [{'field': '__all__', 'messages': [
            'You do not have permission to use this form!'
        ]}]

    def test_it_returns_err_if_hpaction_is_disabled(self, graphql_client, db):
        user = UserFactory.create()
        graphql_client.request.user = user
        result = execute_genpdf_mutation(graphql_client)
        assert 'Please try again later' in result['errors'][0]['messages'][0]

    def test_it_works(self, graphql_client, settings, fake_soap_call, django_file_storage, db):
        settings.HP_ACTION_CUSTOMER_KEY = 'boop'
        user = UserFactory.create()
        graphql_client.request.user = user
        fake_soap_call.simulate_success(user)
        result = execute_genpdf_mutation(graphql_client)
        assert result == {
            'errors': [],
            'session': {'latestHpActionPdfUrl': '/hp/latest.pdf'}
        }


class TestLatestHpActionPdfURL:
    def execute(self, graphql_client):
        return graphql_client.execute(
            'query { session { latestHpActionPdfUrl } }'
        )['data']['session']['latestHpActionPdfUrl']

    def test_it_returns_none_if_unauthenticated(self, graphql_client):
        assert self.execute(graphql_client) is None

    def test_it_returns_none_if_no_documents_exist(self, graphql_client, db):
        graphql_client.request.user = UserFactory.create()
        assert self.execute(graphql_client) is None
