from unittest.mock import MagicMock
import pytest

from users.tests.factories import SecondUserFactory, UserFactory
from users.models import VIEW_TEXT_MESSAGE_PERMISSION
from users.permission_util import get_permissions_from_ns_codenames
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
            userFullName
        }
        hasNextPage
    }
}
"""

USER_DETAILS_QUERY = """
query {
    userDetails(phoneNumber: "5551234567") {
        firstName,
        adminUrl,
        rapidproGroups,
    }
}
"""

USER_SEARCH_QUERY = """
query {
    userSearch(query: "boop") {
        firstName,
        adminUrl,
        rapidproGroups,
    }
}
"""

USER_DETAILS_VIA_EMAIL_QUERY = """
query {
    userDetails(email: "Boop@jones.net") {
        firstName,
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

ALL_QUERIES = [
    (CONVERSATION_QUERY, lambda data: data["conversation"] is None),
    (CONVERSATIONS_QUERY, lambda data: data["conversations"] is None),
    (USER_DETAILS_QUERY, lambda data: data["userDetails"] is None),
    (USER_SEARCH_QUERY, lambda data: data["userSearch"] is None),
    ("query { isVerifiedStaffUser }", lambda data: data["isVerifiedStaffUser"] is None),
    (
        UPDATE_TEXTING_HISTORY_MUTATION,
        lambda data: data["updateTextingHistory"]["authError"] is True,
    ),
]


@pytest.fixture
def mocklog(monkeypatch):
    mock = MagicMock()
    monkeypatch.setattr("texting_history.schema.logger", mock)
    return mock


@pytest.fixture
def auth_graphql_client(db, graphql_client):
    user = UserFactory(is_staff=True, email="boop@jones.net")
    perm = get_permissions_from_ns_codenames([VIEW_TEXT_MESSAGE_PERMISSION])[0]
    user.user_permissions.add(perm)
    graphql_client.request.user = user
    return graphql_client


@pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
def test_endpoints_require_auth(db, graphql_client, query, is_denied, mocklog):
    result = graphql_client.execute(query)
    assert is_denied(result["data"])
    mocklog.info.assert_called_once_with("User must be authenticated!")


@pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
def test_endpoints_require_staff(db, graphql_client, query, is_denied, mocklog):
    graphql_client.request.user = UserFactory()
    result = graphql_client.execute(query)
    assert is_denied(result["data"])
    mocklog.info.assert_called_once_with("User must be staff!")


@pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
def test_endpoints_require_permission(db, graphql_client, query, is_denied, mocklog):
    graphql_client.request.user = UserFactory(is_staff=True)
    result = graphql_client.execute(query)
    assert is_denied(result["data"])
    mocklog.info.assert_called_once_with("User does not have permission to view text messages!")


@pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
def test_endpoints_require_twofactor_when_enabled(
    db, graphql_client, query, settings, is_denied, mocklog
):
    settings.TWOFACTOR_VERIFY_DURATION = 60
    graphql_client.request.user = UserFactory(is_staff=True)
    result = graphql_client.execute(query)
    assert is_denied(result["data"])
    mocklog.info.assert_called_once_with("User must be verified via two-factor authentication!")


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
                "userFullName": "Boop Jones",
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


def test_is_verified_staff_user_works(auth_graphql_client):
    assert auth_graphql_client.execute("query { isVerifiedStaffUser }")["data"] == {
        "isVerifiedStaffUser": True,
    }


def test_user_details_query_works(auth_graphql_client):
    user = auth_graphql_client.request.user
    result = auth_graphql_client.execute(USER_DETAILS_QUERY)["data"]["userDetails"]
    assert result == {
        "firstName": "Boop",
        "adminUrl": f"https://example.com/admin/users/justfixuser/{user.id}/change/",
        "rapidproGroups": [],
    }


def test_user_search_works(auth_graphql_client):
    # Create a second user to make sure our search doesn't include them.
    SecondUserFactory()

    user = auth_graphql_client.request.user
    result = auth_graphql_client.execute(USER_SEARCH_QUERY)["data"]["userSearch"]
    assert result == [
        {
            "firstName": "Boop",
            "adminUrl": f"https://example.com/admin/users/justfixuser/{user.id}/change/",
            "rapidproGroups": [],
        }
    ]


def test_user_details_via_email_query_works(auth_graphql_client):
    result = auth_graphql_client.execute(USER_DETAILS_VIA_EMAIL_QUERY)["data"]["userDetails"]
    assert result == {
        "firstName": "Boop",
    }


def test_user_details_with_no_args_returns_none(auth_graphql_client):
    assert (
        auth_graphql_client.execute("query { userDetails { firstName } }")["data"]["userDetails"]
        is None
    )


def test_update_texting_history_mutation_works(auth_graphql_client, mock_twilio_api):
    result = auth_graphql_client.execute(UPDATE_TEXTING_HISTORY_MUTATION)["data"][
        "updateTextingHistory"
    ]
    assert result == {"authError": False, "latestMessage": "2019-05-24T17:44:50+00:00"}
