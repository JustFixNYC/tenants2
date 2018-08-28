import pytest

from users.tests.factories import UserFactory
from project.util import schema_json
from project.views import FRONTEND_QUERY_DIR


def get_frontend_queries(*filenames):
    return '\n'.join([
        (FRONTEND_QUERY_DIR / filename).read_text()
        for filename in filenames
    ])


def _exec_onboarding_step_1(graphql_client, **input_kwargs):
    return graphql_client.execute(
        get_frontend_queries(
            'OnboardingStep1Mutation.graphql', 'AllSessionInfo.graphql'),
        variable_values={'input': {
            'name': '',
            'address': '',
            'aptNumber': '',
            **input_kwargs
        }}
    )


def test_onboarding_step_1_validates_data(graphql_client):
    result = _exec_onboarding_step_1(graphql_client)
    ob = result['data']['onboardingStep1']
    assert len(ob['errors']) > 0
    assert 'onboarding_step_1' not in graphql_client.request.session


def test_onboarding_step_1_works(graphql_client):
    info = {
        'name': 'boop',
        'address': '123 boop way',
        'aptNumber': '3B'
    }
    result = _exec_onboarding_step_1(graphql_client, **info)
    ob = result['data']['onboardingStep1']
    assert ob['errors'] == []
    assert ob['session']['onboardingStep1'] == info
    assert graphql_client.request.session['onboarding_step_1']['apt_number'] == '3B'


@pytest.mark.django_db
def test_login_works(graphql_client):
    user = UserFactory(phone_number='5551234567', password='blarg')
    result = graphql_client.execute(
        get_frontend_queries(
            'LoginMutation.graphql', 'AllSessionInfo.graphql'),
        variable_values={
            'input': {
                'phoneNumber': '5551234567',
                'password': 'blarg'
            }
        }
    )

    login = result['data']['login']
    assert login['errors'] == []
    assert len(login['session']['csrfToken']) > 0
    assert graphql_client.request.user.pk == user.pk


@pytest.mark.django_db
def test_logout_works(graphql_client):
    user = UserFactory()
    graphql_client.request.user = user
    logout_mutation = get_frontend_queries(
        'LogoutMutation.graphql', 'AllSessionInfo.graphql')
    result = graphql_client.execute(logout_mutation)
    assert len(result['data']['logout']['session']['csrfToken']) > 0
    assert graphql_client.request.user.pk is None


def test_schema_json_is_up_to_date():
    err_msg = (
        f'{schema_json.FILENAME} is out of date! '
        f'Please run "{schema_json.REBUILD_CMDLINE}" to rebuild it.'
    )

    if not schema_json.is_up_to_date():
        raise Exception(err_msg)


def test_is_staff_works(graphql_client):
    def get_is_staff():
        result = graphql_client.execute('query { session { isStaff } }')
        return result['data']['session']['isStaff']

    assert get_is_staff() is False, "anonymous user is not staff"

    graphql_client.request.user = UserFactory.build(is_staff=False)
    assert get_is_staff() is False

    graphql_client.request.user = UserFactory.build(is_staff=True)
    assert get_is_staff() is True
