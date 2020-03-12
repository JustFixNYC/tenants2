import pytest

from users.tests.factories import UserFactory
from users.models import VIEW_TEXT_MESSAGE_PERMISSION
from users.permission_util import get_permissions_from_ns_codenames
from .factories import MessageFactory


CONVERSATION_QUERY = '''
query {
    conversation(phoneNumber: "+15551234567") {
        messages {
            sid,
            dateSent,
            ordering,
            isFromUs,
            body,
            errorMessage
        }
        hasNextPage
    }
}
'''

CONVERSATIONS_QUERY = '''
query {
    conversations {
        messages {
            sid,
            dateSent,
            ordering,
            isFromUs,
            body,
            errorMessage,
            userPhoneNumber,
            userFullName
        }
        hasNextPage
    }
}
'''

USER_DETAILS_QUERY = '''
query {
    userDetails(phoneNumber: "5551234567") {
        firstName,
        adminUrl
    }
}
'''

UPDATE_TEXTING_HISTORY_MUTATION = '''
mutation {
    updateTextingHistory {
        latestMessage
    }
}
'''

ALL_QUERIES = [
    CONVERSATION_QUERY,
    CONVERSATIONS_QUERY,
    USER_DETAILS_QUERY,
    UPDATE_TEXTING_HISTORY_MUTATION,
]


@pytest.fixture
def auth_graphql_client(db, graphql_client):
    user = UserFactory(is_staff=True)
    perm = get_permissions_from_ns_codenames([VIEW_TEXT_MESSAGE_PERMISSION])[0]
    user.user_permissions.add(perm)
    graphql_client.request.user = user
    return graphql_client


@pytest.mark.parametrize("query", ALL_QUERIES)
def test_endpoints_require_auth(db, graphql_client, query):
    result = graphql_client.execute(query, expect_errors=True)
    assert result['errors'][0]['message'] == 'User must be authenticated!'


@pytest.mark.parametrize("query", ALL_QUERIES)
def test_endpoints_require_staff(db, graphql_client, query):
    graphql_client.request.user = UserFactory()
    result = graphql_client.execute(query, expect_errors=True)
    assert result['errors'][0]['message'] == 'User must be staff!'


@pytest.mark.parametrize("query", ALL_QUERIES)
def test_endpoints_require_permission(db, graphql_client, query):
    graphql_client.request.user = UserFactory(is_staff=True)
    result = graphql_client.execute(query, expect_errors=True)
    assert result['errors'][0]['message'] == 'User does not have permission to view text messages!'


@pytest.mark.parametrize("query", ALL_QUERIES)
def test_endpoints_require_twofactor_when_enabled(db, graphql_client, query, settings):
    settings.TWOFACTOR_VERIFY_DURATION = 60
    graphql_client.request.user = UserFactory(is_staff=True)
    result = graphql_client.execute(query, expect_errors=True)
    assert result['errors'][0]['message'] == 'User must be verified via two-factor authentication!'


def test_conversation_query_works(auth_graphql_client):
    MessageFactory.create()
    result = auth_graphql_client.execute(CONVERSATION_QUERY)['data']['conversation']
    assert result == {
        'hasNextPage': False,
        'messages': [{
            'body': 'testing',
            'dateSent': '2020-03-02T18:08:48.890982+00:00',
            'errorMessage': None,
            'isFromUs': False,
            'ordering': 0.0,
            'sid': 'SMded05904ccb347238880ca9264e8fe1c'
        }]
    }


def test_conversations_query_works(auth_graphql_client):
    MessageFactory.create()
    result = auth_graphql_client.execute(CONVERSATIONS_QUERY)['data']['conversations']
    assert result == {
        'hasNextPage': False,
        'messages': [{
            'body': 'testing',
            'dateSent': '2020-03-02T18:08:48.890982+00:00',
            'errorMessage': None,
            'isFromUs': False,
            'ordering': 0.0,
            'sid': '+15551234567',
            'userFullName': 'Boop Jones',
            'userPhoneNumber': '+15551234567',
        }]
    }


@pytest.mark.parametrize("query, num_results", [
    ["boop", 1],
    ["5551234567", 1],
    ["blarg", 0],
    ["has:hpa", 0],
])
def test_conversations_queries_produce_expected_results(auth_graphql_client, query, num_results):
    MessageFactory.create()
    messages = auth_graphql_client.execute(
        '''
        query {
            conversations(query: "%s") {
                messages { body }
            }
        }
        ''' % query
    )['data']['conversations']['messages']
    assert len(messages) == num_results


def test_user_details_query_works(auth_graphql_client):
    user = auth_graphql_client.request.user
    result = auth_graphql_client.execute(USER_DETAILS_QUERY)['data']['userDetails']
    assert result == {
        'firstName': 'Boop',
        'adminUrl': f'https://example.com/admin/users/justfixuser/{user.id}/change/',
    }


def test_update_texting_history_mutation_works(auth_graphql_client, mock_twilio_api):
    result = auth_graphql_client.execute(
        UPDATE_TEXTING_HISTORY_MUTATION
    )['data']['updateTextingHistory']
    assert result == {'latestMessage': '2019-05-24T17:44:50+00:00'}
