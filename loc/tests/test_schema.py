import pytest
from freezegun import freeze_time

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from .test_landlord_lookup import mock_lookup_success, enable_fake_landlord_lookup
from .factories import create_user_with_all_info


DEFAULT_ACCESS_DATES_INPUT = {
    'date1': '',
    'date2': '',
    'date3': '',
}


DEFAULT_LANDLORD_DETAILS_INPUT = {
    'name': '',
    'address': '',
}


DEFAULT_LETTER_REQUEST_INPUT = {
    'mailChoice': 'WE_WILL_MAIL'
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


def execute_lr_mutation(graphql_client, **input):
    input = {**DEFAULT_LETTER_REQUEST_INPUT, **input}
    return graphql_client.execute(
        """
        mutation MyMutation($input: LetterRequestInput!) {
            output: letterRequest(input: $input) {
                errors {
                    field
                    messages
                }
                session {
                    letterRequest {
                        mailChoice,
                        updatedAt
                    }
                }
            }
        }
        """,
        variables={'input': input}
    )['data']['output']


@pytest.mark.django_db
@freeze_time("2017-01-01")
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
def test_landlord_details_is_null_when_user_has_no_onboarding_info(graphql_client):
    graphql_client.request.user = UserFactory.create()
    result = graphql_client.execute('query { session { landlordDetails { name } } }')
    assert result['data']['session']['landlordDetails'] is None


@pytest.mark.django_db
@enable_fake_landlord_lookup
def test_landlord_details_are_created_when_user_has_onboarding_info(
    graphql_client,
    requests_mock,
    nycdb
):
    oi = OnboardingInfoFactory()
    graphql_client.request.user = oi.user
    assert not hasattr(oi.user, 'landlord_details')
    mock_lookup_success(requests_mock, nycdb)
    result = graphql_client.execute(
        'query { session { landlordDetails { name, address, isLookedUp } } }')
    assert result['data']['session']['landlordDetails'] == {
        'address': '124 99TH STREET\nBrooklyn, NY 11999',
        'isLookedUp': True,
        'name': 'BOOP JONES'
    }
    assert hasattr(oi.user, 'landlord_details')


@pytest.mark.django_db
def test_letter_request_works(graphql_client, smsoutbox):
    graphql_client.request.user = create_user_with_all_info()

    result = execute_lr_mutation(graphql_client)
    assert result['errors'] == []
    assert result['session']['letterRequest']['mailChoice'] == 'WE_WILL_MAIL'
    assert isinstance(result['session']['letterRequest']['updatedAt'], str)

    # Ensure we text them if they want us to mail the letter *and* they gave us
    # permission to SMS during onboarding.
    assert len(smsoutbox) == 1
    assert 'received your request' in smsoutbox[0].body

    smsoutbox[:] = []

    result = execute_lr_mutation(graphql_client, mailChoice='USER_WILL_MAIL')
    assert result['errors'] == []
    assert result['session']['letterRequest']['mailChoice'] == 'USER_WILL_MAIL'

    # Ensure no SMS is sent if the user said they'd mail it themselves.
    assert smsoutbox == []


def test_letter_request_requires_auth(graphql_client):
    result = execute_lr_mutation(graphql_client)
    assert result['errors'] == [{'field': '__all__', 'messages': [
        'You do not have permission to use this form!'
    ]}]


def test_letter_request_is_null_when_unauthenticated(graphql_client):
    result = graphql_client.execute('query { session { letterRequest { updatedAt } } }')
    assert result['data']['session']['letterRequest'] is None


@pytest.mark.django_db
def test_letter_request_is_null_when_user_has_not_yet_requested_letter(graphql_client):
    graphql_client.request.user = UserFactory.create()
    result = graphql_client.execute('query { session { letterRequest { updatedAt } } }')
    assert result['data']['session']['letterRequest'] is None
