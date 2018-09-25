from unittest.mock import patch
import pytest
from django.contrib.auth.hashers import is_password_usable

from project.tests.util import get_frontend_queries
from users.models import JustfixUser


VALID_STEP_DATA = {
    1: {
        'name': 'boop jones',
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
        'receivesPublicAssistance': False
    },
    4: {
        'phoneNumber': '5551234567',
        'canWeSms': True,
        'password': 'blarg1234',
        'confirmPassword': 'blarg1234',
        'agreeToTerms': True
    }
}


@pytest.fixture
def fake_geocoding():
    with patch('project.geocoding.search', new=lambda text: None):
        yield None


def _get_step_1_info(graphql_client):
    return graphql_client.execute(
        'query { session { onboardingStep1 { aptNumber } } }'
    )['data']['session']['onboardingStep1']


def _exec_onboarding_step_n(n, graphql_client, **input_kwargs):
    queries = [f'OnboardingStep{n}Mutation.graphql']
    if n == 4:
        queries.append('AllSessionInfo.graphql')
    return graphql_client.execute(
        get_frontend_queries(*queries),
        variable_values={'input': {
            **VALID_STEP_DATA[n],
            **input_kwargs
        }}
    )['data'][f'output']


def test_onboarding_step_1_validates_data(graphql_client, fake_geocoding):
    ob = _exec_onboarding_step_n(1, graphql_client, name='')
    assert len(ob['errors']) > 0
    assert 'onboarding_step_1' not in graphql_client.request.session
    assert _get_step_1_info(graphql_client) is None


def test_onboarding_step_1_works(graphql_client, fake_geocoding):
    ob = _exec_onboarding_step_n(1, graphql_client)
    assert ob['errors'] == []
    assert ob['session']['onboardingStep1'] == VALID_STEP_DATA[1]
    assert graphql_client.request.session['onboarding_step_1']['apt_number'] == '3B'
    assert _get_step_1_info(graphql_client)['aptNumber'] == '3B'


def execute_onboarding(graphql_client, step_data=VALID_STEP_DATA):
    for i in step_data.keys():
        result = _exec_onboarding_step_n(i, graphql_client, **step_data[i])
        assert result['errors'] == []
    return result


@pytest.mark.django_db
def test_onboarding_works(graphql_client, fake_geocoding):
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


@pytest.mark.django_db
def test_onboarding_works_without_password(graphql_client, fake_geocoding):
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
