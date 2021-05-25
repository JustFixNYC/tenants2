from project.tests.schema_admin_test_util import make_permission_test_class
import pytest

from users.tests.factories import UserFactory
from users.models import VIEW_TEXT_MESSAGE_PERMISSION
from .factories import MessageFactory


CONVERSATION_QUERY = """
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
"""

CONVERSATIONS_QUERY = """
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
            userFullLegalName
        }
        hasNextPage
    }
}
"""

UPDATE_TEXTING_HISTORY_MUTATION = """
mutation {
    updateTextingHistory {
        authError,
        latestMessage
    }
}
"""

TestAdminEndpoints = make_permission_test_class(
    [
        (CONVERSATION_QUERY, lambda data: data["conversation"] is None),
        (CONVERSATIONS_QUERY, lambda data: data["conversations"] is None),
        (
            UPDATE_TEXTING_HISTORY_MUTATION,
            lambda data: data["updateTextingHistory"]["authError"] is True,
        ),
    ],
    VIEW_TEXT_MESSAGE_PERMISSION,
)


@pytest.fixture
def auth_graphql_client(db, graphql_client):
    user = UserFactory(
        is_staff=True, email="boop@jones.net", user_permissions=[VIEW_TEXT_MESSAGE_PERMISSION]
    )
    graphql_client.request.user = user
    return graphql_client


def test_conversation_query_works(auth_graphql_client):
    MessageFactory.create()
    result = auth_graphql_client.execute(CONVERSATION_QUERY)["data"]["conversation"]
    assert result == {
        "hasNextPage": False,
        "messages": [
            {
                "body": "testing",
                "dateSent": "2020-03-02T18:08:48.890982+00:00",
                "errorMessage": None,
                "isFromUs": False,
                "ordering": 0.0,
                "sid": "SMded05904ccb347238880ca9264e8fe1c",
            }
        ],
    }


def test_conversations_query_works(auth_graphql_client):
    MessageFactory.create()
    result = auth_graphql_client.execute(CONVERSATIONS_QUERY)["data"]["conversations"]
    assert result == {
        "hasNextPage": False,
        "messages": [
            {
                "body": "testing",
                "dateSent": "2020-03-02T18:08:48.890982+00:00",
                "errorMessage": None,
                "isFromUs": False,
                "ordering": 0.0,
                "sid": "+15551234567",
                "userFullLegalName": "Boop Jones",
                "userPhoneNumber": "+15551234567",
            }
        ],
    }


@pytest.mark.parametrize(
    "query, num_results",
    [
        ["boop", 1],
        ["5551234567", 1],
        ["blarg", 0],
        ["has:hpa", 0],
        ['\\"some text in the message body\\"', 0],
    ],
)
def test_conversations_queries_produce_expected_results(auth_graphql_client, query, num_results):
    MessageFactory.create()
    messages = auth_graphql_client.execute(
        """
        query {
            conversations(query: "%s") {
                messages { body }
            }
        }
        """
        % query
    )["data"]["conversations"]["messages"]
    assert len(messages) == num_results


def test_update_texting_history_mutation_works(auth_graphql_client, mock_twilio_api):
    result = auth_graphql_client.execute(UPDATE_TEXTING_HISTORY_MUTATION)["data"][
        "updateTextingHistory"
    ]
    assert result == {"authError": False, "latestMessage": "2019-05-24T17:44:50+00:00"}
