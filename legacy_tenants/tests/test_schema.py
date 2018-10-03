import pytest

from users.tests.factories import UserFactory
from .factories import LegacyUserInfoFactory


class TestPrefersLegacyApp:
    def get(self, client):
        return client.execute(
            'query { session { prefersLegacyApp } }'
        )['data']['session']['prefersLegacyApp']

    def test_is_none_when_settings_not_configured(self, graphql_client):
        assert self.get(graphql_client) is None

    def test_is_none_when_not_authenticated(self, mock_mongodb, graphql_client):
        assert self.get(graphql_client) is None

    @pytest.mark.django_db
    def test_is_none_when_not_legacy_user(self, mock_mongodb, graphql_client):
        graphql_client.request.user = UserFactory.create()
        assert self.get(graphql_client) is None

    @pytest.mark.django_db
    def test_is_boolean_when_legacy_user(self, mock_mongodb, graphql_client):
        user = UserFactory.create()
        info = LegacyUserInfoFactory.create(user=user)
        graphql_client.request.user = user
        assert self.get(graphql_client) is True

        info.prefers_legacy_app = False
        info.save()
        assert self.get(graphql_client) is False
