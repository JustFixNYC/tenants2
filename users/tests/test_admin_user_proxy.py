import pytest

from users.admin_user_proxy import UserProxyAdmin


def test_filter_queryset_for_changelist_view_returns_queryset():
    assert (
        UserProxyAdmin.filter_queryset_for_changelist_view(None, "BLAH") == "BLAH"
    )  # type: ignore


class UserProxyAdminTester:
    """
    This abstract class can be used to quickly test the views of
    a User proxy model.
    """

    # This should be overridden by subclasses to point to the
    # list view for the User proxy model.
    list_view_url = ""

    @pytest.fixture
    def user(self, db):
        """
        A fixture to create and yield a user that we'll expect to be shown in
        the admin views.
        """

        yield self.create_user()

    @pytest.fixture
    def client(self, db, outreach_client):
        """
        A fixture to get an HTTP client for the tests.
        """

        yield outreach_client

    def create_user(self):
        """
        This needs to be implemented by subclasses to create and return
        a user.  Other related models can be created at the same time, though
        the user is what must be returned.
        """

        raise NotImplementedError()

    def ensure_list_view_content(self, user, content):
        """
        Test the HTML of the list view to make sure it's what we expect.
        This can be overridden by subclasses.
        """

        # Just make sure our user is listed.
        assert user.first_name in content

    def test_list_view(self, user, client):
        """
        Ensure that the list view for the User proxy model admin works.
        """

        res = client.get(self.list_view_url)
        assert res.status_code == 200
        self.ensure_list_view_content(user, res.content.decode("utf-8"))

    def ensure_change_view_content(self, user, content):
        """
        Test the HTML of the change (detail) view to make sure it's what we expect.
        This can be overridden by subclasses.
        """

        # Make sure the user's first name is displayed somewhere.
        assert user.first_name in content

    def test_change_view(self, user, client):
        """
        Ensure that the change (detail) view for the User proxy model admin works.
        """

        res = client.get(f"{self.list_view_url}{user.pk}/change/")
        assert res.status_code == 200
        self.ensure_change_view_content(user, res.content.decode("utf-8"))
