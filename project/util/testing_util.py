from typing import Dict, Any, Optional
import pytest


def one_field_err(message: str, field: str = '__all__'):
    '''
    Returns a GraphQL form error validation response of a
    single error for a single field.
    '''

    return [{'field': field, 'messages': [message]}]


class GraphQLTestingPal:
    '''
    A class that makes it easier to test GraphQL endpoints.
    
    It can be used to test any kind of GraphQL endpoint, but is
    specifically built for testing GraphQL mutations that wrap
    Django forms.
    '''

    # This should be set to a GraphQL mutation that takes an 'input'
    # variable and returns a single result called 'output'.
    QUERY: str = ''

    # This should be set to a dictionary containing the default value
    # of the 'input' variable.
    DEFAULT_INPUT: Dict[str, Any] = {}

    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.graphql_client = graphql_client
        self.request = graphql_client.request
        self.user = graphql_client.request.user

    def execute(self, input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        '''
        Execute the GraphQL query defined by self.QUERY, passing
        in any optional input that will be merged with the default input.

        Returns the single 'output' result of the query.
        '''

        res = self.graphql_client.execute(self.QUERY, variables={'input': {
            **self.DEFAULT_INPUT,
            **(input or {}),
        }})
        return res['data']['output']

    def assert_one_field_err(
        self,
        message: str,
        field: str = '__all__',
        input: Optional[Dict[str, Any]] = None,
    ):
        '''
        Ensures that the GraphQL query defined by self.QUERY raises
        a single error for a single field.
        '''

        errors = self.execute(input=input)['errors']
        expected = one_field_err(message, field)
        if errors != expected:
            raise AssertionError(f"Expected errors to be {expected} but it is {errors}")

    def one_field_err(self, message: str, field: str = '__all__'):
        '''
        Returns a GraphQL form error validation response of a
        single error for a single field.
        '''

        return one_field_err(message, field)
