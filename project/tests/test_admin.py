from django.urls import reverse

from frontend.tests.test_views import SAFE_MODE_DISABLED_SENTINEL


def test_download_data_link_is_visible(admin_client):
    res = admin_client.get("/admin/")
    assert res.status_code == 200
    assert b"Download data</a>" in res.content


def test_admin_login_is_ours(client, allow_lambda_http, db):
    url = reverse("admin:login")
    assert url == "/admin/login/"

    response = client.get(url)
    assert response.status_code == 200
    html = response.content.decode("utf-8")
    assert "Phone number" in html
    assert SAFE_MODE_DISABLED_SENTINEL in html
