import pytest

from users.admin_user_proxy import UserProxyAdmin


def test_filter_queryset_for_changelist_view_returns_queryset():
    assert UserProxyAdmin.filter_queryset_for_changelist_view(
        None, "BLAH") == "BLAH"  # type: ignore


class UserProxyAdminTester:
    list_view_url = ''

    @pytest.fixture
    def user(self, db):
        yield self.create_user()

    @pytest.fixture
    def client(self, db, outreach_client):
        yield outreach_client

    def create_user(self):
        raise NotImplementedError()

    def ensure_list_view_content(self, user, content):
        assert user.first_name in content

    def test_list_view(self, user, client):
        res = client.get(self.list_view_url)
        assert res.status_code == 200
        self.ensure_list_view_content(user, res.content.decode('utf-8'))

    def ensure_change_view_content(self, user, content):
        assert user.first_name in content

    def test_change_view(self, user, client):
        res = client.get(f'{self.list_view_url}{user.pk}/change/')
        assert res.status_code == 200
        self.ensure_change_view_content(user, res.content.decode('utf-8'))
