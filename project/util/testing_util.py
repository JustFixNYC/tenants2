import pytest


def one_field_err(message: str, field: str = '__all__'):
    '''
    Returns a GraphQL form error validation response of a
    single error for a single field.
    '''

    return [{'field': field, 'messages': [message]}]


class GraphQLTestingPal:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.graphql_client = graphql_client
        self.user = graphql_client.request.user

    def one_field_err(self, message: str, field: str = '__all__'):
        '''
        Returns a GraphQL form error validation response of a
        single error for a single field.
        '''

        return one_field_err(message, field)
