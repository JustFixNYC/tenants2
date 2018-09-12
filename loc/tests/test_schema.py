import pytest
from users.tests.factories import UserFactory


DEFAULT_INPUT = {
    'date1': '',
    'date2': '',
    'date3': '',
}


def execute_mutation(graphql_client, **input):
    input = {**DEFAULT_INPUT, **input}
    return graphql_client.execute(
        """
        mutation MyMutation($input: AccessDatesInput!) {
            output: accessDates(input: $input) {
                errors {
                    field
                    messages
                }
                session {
                    accessDates
                }
            }
        }
        """,
        variables={'input': input}
    )['data']['output']


@pytest.mark.django_db
def test_access_dates_works(graphql_client):
    graphql_client.request.user = UserFactory.create()

    result = execute_mutation(graphql_client, **{
        'date1': '01/02/2018'
    })
    assert result['errors'] == []
    assert result['session']['accessDates'] == ['2018-01-02']

    result = execute_mutation(graphql_client, **{
        'date1': '2019-01-01',
        'date2': '2020-01-02'
    })
    assert result['errors'] == []
    assert result['session']['accessDates'] == ['2019-01-01', '2020-01-02']


def test_access_dates_requires_auth(graphql_client):
    result = execute_mutation(graphql_client)
    assert result['errors'] == [{'field': '__all__', 'messages': [
        'You do not have permission to use this form!'
    ]}]


def test_access_dates_is_empty_when_unauthenticated(graphql_client):
    result = graphql_client.execute('query { session { accessDates } }')
    assert result['data']['session']['accessDates'] == []
