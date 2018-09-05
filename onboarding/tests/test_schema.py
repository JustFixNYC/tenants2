from project.tests.util import get_frontend_queries


def _get_step_1_info(graphql_client):
    return graphql_client.execute(
        'query { session { onboardingStep1 { aptNumber } } }'
    )['data']['session']['onboardingStep1']


def _exec_onboarding_step_1(graphql_client, **input_kwargs):
    return graphql_client.execute(
        get_frontend_queries(
            'OnboardingStep1Mutation.graphql', 'AllSessionInfo.graphql'),
        variable_values={'input': {
            'name': '',
            'address': '',
            'aptNumber': '',
            'borough': '',
            **input_kwargs
        }}
    )


def test_onboarding_step_1_validates_data(graphql_client):
    result = _exec_onboarding_step_1(graphql_client)
    ob = result['data']['onboardingStep1']
    assert len(ob['errors']) > 0
    assert 'onboarding_step_1' not in graphql_client.request.session
    assert _get_step_1_info(graphql_client) is None


def test_onboarding_step_1_works(graphql_client):
    info = {
        'name': 'boop',
        'address': '123 boop way',
        'borough': 'MANHATTAN',
        'aptNumber': '3B'
    }
    result = _exec_onboarding_step_1(graphql_client, **info)
    ob = result['data']['onboardingStep1']
    assert ob['errors'] == []
    assert ob['session']['onboardingStep1'] == info
    assert graphql_client.request.session['onboarding_step_1']['apt_number'] == '3B'
    assert _get_step_1_info(graphql_client)['aptNumber'] == '3B'
