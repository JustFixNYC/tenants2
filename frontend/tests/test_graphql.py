import pytest

from users.tests.factories import UserFactory
from frontend.graphql import execute_query, get_initial_session
from project.graphql_static_request import GraphQLStaticRequest


def test_execute_query_raises_exception_on_errors(graphql_client):
    with pytest.raises(Exception) as exc_info:
        execute_query(graphql_client.request, "bloop")
    assert "bloop" in str(exc_info.value)


def test_get_initial_session_works(db, graphql_client):
    request = graphql_client.request
    assert len(get_initial_session(request)["csrfToken"]) > 0


class TestGraphQLStaticRequest:
    def test_get_initial_session_works_with_anonymous_user(self, db):
        request = GraphQLStaticRequest()
        session = get_initial_session(request)

        assert session["firstName"] is None
        assert session["csrfToken"] == ""
        assert session["isSafeModeEnabled"] is False
        assert request.session == {}

    def test_get_initial_session_works_with_authenticated_user(self, db):
        request = GraphQLStaticRequest(user=UserFactory())
        session = get_initial_session(request)

        assert session["firstName"] == "Boop"
        assert session["csrfToken"] == ""
        assert session["isSafeModeEnabled"] is False
        assert request.session == {}
