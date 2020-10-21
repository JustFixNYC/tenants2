import pytest
from freezegun import freeze_time

from project.util.testing_util import one_field_err
from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from .test_landlord_lookup import mock_lookup_success, enable_fake_landlord_lookup
from .factories import (
    create_user_with_all_info,
    create_user_with_finished_letter,
    LandlordDetailsV2Factory
)


DEFAULT_ACCESS_DATES_INPUT = {
    'date1': '',
    'date2': '',
    'date3': '',
}


DEFAULT_LANDLORD_DETAILS_V2_INPUT = {
    'name': '',
    'primaryLine': '',
    'city': '',
    'state': '',
    'zipCode': '',
}

DEFAULT_LETTER_REQUEST_INPUT = {
    'mailChoice': 'WE_WILL_MAIL'
}

EXAMPLE_LANDLORD_DETAILS_V2_INPUT = {
    'name': 'Boop Jones',
    'primaryLine': '123 Boop Way',
    'city': 'Somewhere',
    'state': 'NY',
    'zipCode': '11299',
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


def execute_ld2_mutation(graphql_client, **input):
    input = {**DEFAULT_LANDLORD_DETAILS_V2_INPUT, **input}
    return graphql_client.execute(
        """
        mutation MyMutation($input: LandlordDetailsV2Input!) {
            output: landlordDetailsV2(input: $input) {
                errors {
                    field
                    messages
                }
                isUndeliverable,
                session {
                    landlordDetails {
                        name
                        primaryLine
                        city
                        state
                        zipCode
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
def test_landlord_details_v2_creates_details(graphql_client):
    graphql_client.request.user = UserFactory()
    ld_1 = EXAMPLE_LANDLORD_DETAILS_V2_INPUT
    result = execute_ld2_mutation(graphql_client, **ld_1)
    assert result['errors'] == []
    assert result['isUndeliverable'] is None
    assert result['session']['landlordDetails'] == ld_1


@pytest.mark.django_db
def test_landlord_details_v2_requires_fields(graphql_client):
    graphql_client.request.user = UserFactory()
    errors = execute_ld2_mutation(graphql_client)['errors']
    expected_errors = 5
    assert len(errors) == expected_errors
    for i in range(expected_errors):
        assert errors[0]['messages'] == [
            'This field is required.'
        ]


@pytest.mark.django_db
def test_landlord_details_v2_modifies_existing_details(graphql_client):
    ld = LandlordDetailsV2Factory(is_looked_up=True)
    graphql_client.request.user = ld.user

    assert execute_ld2_mutation(graphql_client, name="blop")['errors'][0]['messages'] == [
        'This field is required.'
    ]

    ld.refresh_from_db()
    assert ld.is_looked_up is True

    ld_1 = EXAMPLE_LANDLORD_DETAILS_V2_INPUT

    result = execute_ld2_mutation(graphql_client, **ld_1)
    assert result['errors'] == []
    assert result['session']['landlordDetails'] == ld_1

    ld.refresh_from_db()
    assert ld.address == "123 Boop Way\nSomewhere, NY 11299"
    assert ld.is_looked_up is False


@pytest.mark.django_db
def test_landlord_details_address_represents_best_address(graphql_client):
    ld = LandlordDetailsV2Factory(address='some outdated legacy blob of text')
    graphql_client.request.user = ld.user
    res = graphql_client.execute('query { session { landlordDetails { address } } }')
    assert res['data']['session']['landlordDetails']['address'] == \
        '123 Cloud City Drive\nBespin, NY 12345'


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
def test_letter_request_works(graphql_client, smsoutbox, allow_lambda_http, mailoutbox, settings):
    settings.LOC_EMAIL = 'letters@justfigs.nyc'
    user = create_user_with_all_info()
    user.email = "bobby@denver.net"
    user.save()
    graphql_client.request.user = user

    result = execute_lr_mutation(graphql_client)
    assert result['errors'] == []
    assert result['session']['letterRequest']['mailChoice'] == 'WE_WILL_MAIL'
    assert isinstance(result['session']['letterRequest']['updatedAt'], str)

    assert len(mailoutbox) == 1
    assert "Bobby Denver" in mailoutbox[0].subject
    assert mailoutbox[0].recipients() == ['letters@justfigs.nyc']
    assert mailoutbox[0].reply_to == ['bobby@denver.net']

    mailoutbox[:] = []

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

    # Ensure we weren't notified if the user said they'd mail it themselves.
    assert mailoutbox == []


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


class TestEmailLetter:
    QUERY = '''
        mutation {
            emailLetter(input: {recipients: [{email: "boop@jones.com"}]}) {
                errors { field, messages }
                recipients
            }
        }
    '''

    def test_email_letter_works(self, db, graphql_client, mailoutbox):
        graphql_client.request.user = create_user_with_finished_letter()
        result = graphql_client.execute(self.QUERY)['data']['emailLetter']
        assert result == {'errors': [], 'recipients': ['boop@jones.com']}
        assert len(mailoutbox) == 1

    def test_email_letter_fails_when_letter_not_finished(self, db, graphql_client, mailoutbox):
        graphql_client.request.user = UserFactory()
        result = graphql_client.execute(self.QUERY)['data']['emailLetter']
        assert result == {
            'errors': one_field_err('You have not completed a Letter of Complaint!'),
            'recipients': None
        }
        assert len(mailoutbox) == 0


def _exec_relief_attempts_form(graphql_client, input):
    return graphql_client.execute(
        """
        mutation MyMutation($input: ReliefAttemptsInput!) {
            output: reliefAttempts(input: $input) {
                errors { field, messages }
            }
        }
        """,
        variables={'input': input}
    )['data']['output']


def test_relief_attempts_form_validates_data(db, graphql_client):
    oi = OnboardingInfoFactory()
    graphql_client.request.user = oi.user
    result = _exec_relief_attempts_form(graphql_client, {'hasCalled311': 'Boop'})
    assert len(result['errors']) > 0


def test_relief_attempts_form_saves_data_to_db(db, graphql_client):
    oi = OnboardingInfoFactory()
    graphql_client.request.user = oi.user
    result = _exec_relief_attempts_form(graphql_client, {'hasCalled311': 'True'})
    oi.refresh_from_db()
    assert result['errors'] == []
    assert oi.has_called_311 is True


def test_letter_styles_works(graphql_client):
    res = graphql_client.execute(
        '''
        query {
            letterStyles { inlinePdfCss, htmlCssUrls }
        }
        '''
    )['data']['letterStyles']
    assert '@page' in res['inlinePdfCss']
    assert res['htmlCssUrls'] == [
        '/static/loc/loc-fonts.css',
        '/static/loc/pdf-styles.css',
        '/static/loc/loc-preview-styles.css'
    ]


class TestRecommendedLocLandlord:
    QUERY = '''
    query {
        recommendedLocLandlord {
            name,
            primaryLine,
            city,
            state,
            zipCode
        }
    }
    '''

    def test_it_returns_none_for_logged_out_user(self, graphql_client):
        res = graphql_client.execute(self.QUERY)
        assert res['data']['recommendedLocLandlord'] is None

    def test_it_returns_none_when_user_has_no_recommendation(self, db, graphql_client):
        graphql_client.request.user = UserFactory()
        res = graphql_client.execute(self.QUERY)
        assert res['data']['recommendedLocLandlord'] is None

    @enable_fake_landlord_lookup
    def test_it_returns_recommendation(self, db, graphql_client, requests_mock, nycdb):
        mock_lookup_success(requests_mock, nycdb)
        oi = OnboardingInfoFactory()
        graphql_client.request.user = oi.user
        res = graphql_client.execute(self.QUERY)
        assert res['data']['recommendedLocLandlord'] == {
            'name': 'BOOP JONES',
            'primaryLine': '124 99TH STREET',
            'city': 'Brooklyn',
            'state': 'NY',
            'zipCode': '11999',
        }
