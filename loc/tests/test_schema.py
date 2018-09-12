import pytest
from users.tests.factories import UserFactory


DEFAULT_ACCESS_DATES_INPUT = {
    'date1': '',
    'date2': '',
    'date3': '',
}


DEFAULT_LANDLORD_DETAILS_INPUT = {
    'name': '',
    'address': '',
}


def execute_ad_mutation(graphql_client, **input):
    input = {**DEFAULT_ACCESS_DATES_INPUT, **input}
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


def execute_ld_mutation(graphql_client, **input):
    input = {**DEFAULT_LANDLORD_DETAILS_INPUT, **input}
    return graphql_client.execute(
        """
        mutation MyMutation($input: LandlordDetailsInput!) {
            output: landlordDetails(input: $input) {
                errors {
                    field
                    messages
                }
                session {
                    landlordDetails {
                        name
                        address
                    }
                }
            }
        }
        """,
        variables={'input': input}
    )['data']['output']


@pytest.mark.django_db
def test_access_dates_works(graphql_client):
    graphql_client.request.user = UserFactory.create()

    result = execute_ad_mutation(graphql_client, **{
        'date1': '01/02/2018'
    })
    assert result['errors'] == []
    assert result['session']['accessDates'] == ['2018-01-02']

    result = execute_ad_mutation(graphql_client, **{
        'date1': '2019-01-01',
        'date2': '2020-01-02'
    })
    assert result['errors'] == []
    assert result['session']['accessDates'] == ['2019-01-01', '2020-01-02']


def test_access_dates_requires_auth(graphql_client):
    result = execute_ad_mutation(graphql_client)
    assert result['errors'] == [{'field': '__all__', 'messages': [
        'You do not have permission to use this form!'
    ]}]


def test_access_dates_is_empty_when_unauthenticated(graphql_client):
    result = graphql_client.execute('query { session { accessDates } }')
    assert result['data']['session']['accessDates'] == []


@pytest.mark.django_db
def test_landlord_details_works(graphql_client):
    graphql_client.request.user = UserFactory.create()
    ld_1 = {
        'name': 'Boop Jones',
        'address': '123 Boop Way\nSomewhere, NY 11299'
    }

    result = execute_ld_mutation(graphql_client, **ld_1)
    assert result['errors'] == []
    assert result['session']['landlordDetails'] == ld_1

    ld_2 = {**ld_1, 'name': 'Boopy Jones'}
    result = execute_ld_mutation(graphql_client, **ld_2)
    assert result['errors'] == []
    assert result['session']['landlordDetails'] == ld_2


def test_landlord_details_requires_auth(graphql_client):
    result = execute_ld_mutation(graphql_client)
    assert result['errors'] == [{'field': '__all__', 'messages': [
        'You do not have permission to use this form!'
    ]}]


def test_landlord_details_is_null_when_unauthenticated(graphql_client):
    result = graphql_client.execute('query { session { landlordDetails { name } } }')
    assert result['data']['session']['landlordDetails'] is None


@pytest.mark.django_db
def test_landlord_details_is_null_when_user_has_not_yet_provided_it(graphql_client):
    graphql_client.request.user = UserFactory.create()
    result = graphql_client.execute('query { session { landlordDetails { name } } }')
    assert result['data']['session']['landlordDetails'] is None
