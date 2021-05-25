from project.util.testing_util import ClassCachedValue
from .factories import UserFactory


# Content that shows up on a user change page if the
# logged-in user can set the superuser status of the user.
SUPERUSER_SENTINEL = "superuser"


def test_list_view_works(admin_client):
    UserFactory(full_legal_name="Blargy Blargface")
    res = admin_client.get("/admin/users/justfixuser/")
    assert res.status_code == 200
    assert b"Blargy" in res.content


def get_user_change_view_html(client):
    user = UserFactory(full_legal_name="Blargy Blargface")
    res = client.get(f"/admin/users/justfixuser/{user.pk}/change/")
    assert res.status_code == 200
    assert b"Blargface" in res.content
    return res.content.decode("utf-8")


class TestChangeViewForSuperusers(ClassCachedValue):
    @classmethod
    def cache_value(cls, admin_client):
        return get_user_change_view_html(admin_client)

    def test_hp_action_information_is_shown(self, admin_client):
        assert "HP action" in self.get_value(admin_client)

    def test_superuser_checkbox_is_shown(self, admin_client):
        assert SUPERUSER_SENTINEL in self.get_value(admin_client)


def test_superuser_checkbox_is_not_shown_for_outreach(outreach_client):
    html = get_user_change_view_html(outreach_client)
    assert SUPERUSER_SENTINEL not in html
