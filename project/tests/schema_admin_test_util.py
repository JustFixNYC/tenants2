from users.tests.factories import UserFactory
import pytest

from unittest.mock import MagicMock


def make_permission_test_class(ALL_QUERIES):
    class TestAdminPermissions:
        @pytest.fixture
        def mocklog(self, monkeypatch):
            mock = MagicMock()
            monkeypatch.setattr("project.schema_admin.logger", mock)
            return mock

        @pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
        def test_endpoints_require_auth(self, db, graphql_client, query, is_denied, mocklog):
            result = graphql_client.execute(query)
            assert is_denied(result["data"])
            mocklog.info.assert_called_once_with("User must be authenticated!")

        @pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
        def test_endpoints_require_staff(self, db, graphql_client, query, is_denied, mocklog):
            graphql_client.request.user = UserFactory()
            result = graphql_client.execute(query)
            assert is_denied(result["data"])
            mocklog.info.assert_called_once_with("User must be staff!")

        @pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
        def test_endpoints_require_permission(self, db, graphql_client, query, is_denied, mocklog):
            graphql_client.request.user = UserFactory(is_staff=True)
            result = graphql_client.execute(query)
            assert is_denied(result["data"])
            mocklog.info.assert_called_once_with(
                "User does not have permission to view text messages!"
            )

        @pytest.mark.parametrize("query, is_denied", ALL_QUERIES)
        def test_endpoints_require_twofactor_when_enabled(
            self, db, graphql_client, query, settings, is_denied, mocklog
        ):
            settings.TWOFACTOR_VERIFY_DURATION = 60
            graphql_client.request.user = UserFactory(is_staff=True)
            result = graphql_client.execute(query)
            assert is_denied(result["data"])
            mocklog.info.assert_called_once_with(
                "User must be verified via two-factor authentication!"
            )

    return TestAdminPermissions
