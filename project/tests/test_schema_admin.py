from project.tests.schema_admin_test_util import (
    make_permission_test_class,
)
import pytest

from users.tests.factories import SecondUserFactory, UserFactory
from users.models import CHANGE_USER_PERMISSION


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

TestAdminEndpoints = make_permission_test_class(
    [
        (USER_DETAILS_QUERY, lambda data: data["userDetails"] is None),
        (USER_SEARCH_QUERY, lambda data: data["userSearch"] is None),
        ("query { isVerifiedStaffUser }", lambda data: data["isVerifiedStaffUser"] is None),
    ]
)


@pytest.fixture
def auth_graphql_client(db, graphql_client):
    user = UserFactory(
        is_staff=True, email="boop@jones.net", user_permissions=[CHANGE_USER_PERMISSION]
    )
    graphql_client.request.user = user
    return graphql_client


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


def test_is_verified_staff_user_works(auth_graphql_client):
    assert auth_graphql_client.execute("query { isVerifiedStaffUser }")["data"] == {
        "isVerifiedStaffUser": True,
    }
