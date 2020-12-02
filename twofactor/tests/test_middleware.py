import pytest

from . import urls


@pytest.mark.urls(urls)
class TestAdminRequires2faMiddleware:
    def test_unauthenticated_users_are_sent_to_login(self, client):
        res = client.get("/admin/")
        assert res.status_code == 302
        assert res["location"] == "/admin/login/?next=/admin/"

    def test_authenticated_users_are_sent_to_verify(self, admin_client):
        res = admin_client.get("/admin/")
        assert res.status_code == 302
        assert res["location"] == "/verify?next=http%3A//testserver/admin/"

    def test_verified_users_are_passed_through(self, admin_client):
        admin_client.post("/autoverify")
        res = admin_client.get("/admin/")
        assert res.status_code == 200
