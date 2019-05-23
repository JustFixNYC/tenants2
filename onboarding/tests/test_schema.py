from unittest.mock import patch
import pytest
from django.contrib.auth.hashers import is_password_usable

from project.tests.util import get_frontend_query
from users.models import JustfixUser
from onboarding.schema import session_key_for_step


VALID_STEP_DATA = {
    1: {
        'firstName': 'boop',
        'lastName': 'jones',
        'address': '123 boop way',
        'borough': 'MANHATTAN',
        'aptNumber': '3B'
    },
    2: {
        'isInEviction': False,
        'needsRepairs': True,
        'hasNoServices': False,
        'hasPests': False,
        'hasCalled311': False
    },
    3: {
        'leaseType': 'MARKET_RATE',
        'receivesPublicAssistance': 'False'
    },
    4: {
        'phoneNumber': '5551234567',
        'canWeSms': True,
        'signupIntent': 'LOC',
        'password': 'blarg1234',
        'confirmPassword': 'blarg1234',
        'agreeToTerms': True
    }
}

ONBOARDING_INFO_QUERY = '''
query {
    session {
        onboardingInfo {
            signupIntent
        }
    }
}
'''


def _get_step_1_info(graphql_client):
    return graphql_client.execute(
        'query { session { onboardingStep1 { aptNumber } } }'
    )['data']['session']['onboardingStep1']


def _exec_onboarding_step_n(n, graphql_client, **input_kwargs):
    return graphql_client.execute(
        get_frontend_query(f'OnboardingStep{n}Mutation.graphql'),
        variables={'input': {
            **VALID_STEP_DATA[n],
            **input_kwargs
        }}
    )['data'][f'output']


def test_onboarding_step_1_validates_data(graphql_client):
    ob = _exec_onboarding_step_n(1, graphql_client, firstName='')
    assert len(ob['errors']) > 0
    assert session_key_for_step(1) not in graphql_client.request.session
    assert _get_step_1_info(graphql_client) is None


def test_onboarding_step_1_works(graphql_client):
    ob = _exec_onboarding_step_n(1, graphql_client)
    assert ob['errors'] == []
    assert ob['session']['onboardingStep1'] == VALID_STEP_DATA[1]
    assert graphql_client.request.session[session_key_for_step(1)]['apt_number'] == '3B'
    assert _get_step_1_info(graphql_client)['aptNumber'] == '3B'


@pytest.mark.django_db
def test_onboarding_step_4_returns_err_if_prev_steps_not_completed(graphql_client):
    result = _exec_onboarding_step_n(4, graphql_client)
    assert result['errors'] == [{
        'field': '__all__',
        'extendedMessages': [
            {"message": "You haven't completed all the previous steps yet.", "code": None}
        ]
    }]


def execute_onboarding(graphql_client, step_data=VALID_STEP_DATA):
    for i in step_data.keys():
        result = _exec_onboarding_step_n(i, graphql_client, **step_data[i])
        assert result['errors'] == []
    return result


@pytest.mark.django_db
def test_onboarding_works(graphql_client, smsoutbox):
    result = execute_onboarding(graphql_client)

    for i in [1, 2, 3]:
        assert result['session'][f'onboardingStep{i}'] is None
    assert result['session']['phoneNumber'] == '5551234567'

    request = graphql_client.request
    user = JustfixUser.objects.get(phone_number='5551234567')
    oi = user.onboarding_info
    assert user.full_name == 'boop jones'
    assert user.pk == request.user.pk
    assert is_password_usable(user.password) is True
    assert oi.address == '123 boop way'
    assert oi.needs_repairs is True
    assert oi.lease_type == 'MARKET_RATE'
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == "+15551234567"
    assert "Welcome to JustFix.nyc, boop" in smsoutbox[0].body


@pytest.mark.django_db
def test_onboarding_info_is_none_when_it_does_not_exist(graphql_client):
    result = graphql_client.execute(ONBOARDING_INFO_QUERY)['data']['session']
    assert result['onboardingInfo'] is None


@pytest.mark.django_db
def test_onboarding_info_is_present_when_it_exists(graphql_client):
    execute_onboarding(graphql_client)
    result = graphql_client.execute(ONBOARDING_INFO_QUERY)['data']['session']
    assert result['onboardingInfo']['signupIntent'] == 'LOC'


@pytest.mark.django_db
def test_onboarding_works_without_password(graphql_client):
    result = execute_onboarding(graphql_client, {
        **VALID_STEP_DATA,
        4: {
            **VALID_STEP_DATA[4],
            'password': '',
            'confirmPassword': '',
        }
    })

    assert result['session']['phoneNumber'] == '5551234567'
    request = graphql_client.request
    user = JustfixUser.objects.get(phone_number='5551234567')
    oi = user.onboarding_info
    assert user.full_name == 'boop jones'
    assert user.pk == request.user.pk
    assert is_password_usable(user.password) is False
    assert oi.address == '123 boop way'


def test_onboarding_session_info_is_fault_tolerant(graphql_client):
    key = session_key_for_step(1)
    graphql_client.request.session[key] = {'lol': 1}

    with patch('onboarding.schema.logger') as m:
        assert _get_step_1_info(graphql_client) is None
        m.exception.assert_called_once_with(f'Error deserializing {key} from session')
        assert key not in graphql_client.request.session
