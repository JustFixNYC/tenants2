from django.urls import reverse

from users.tests.factories import UserFactory
from .test_views import SAFE_MODE_DISABLED_SENTINEL


def test_download_data_link_is_visible(admin_client):
    res = admin_client.get('/admin/')
    assert res.status_code == 200
    assert b'Download data</a>' in res.content


def test_admin_login_is_ours(client):
    url = reverse('admin:login')
    assert url == '/admin/login/'

    response = client.get(url)
    assert response.status_code == 200
    html = response.content.decode('utf-8')
    assert 'Phone number' in html
    assert SAFE_MODE_DISABLED_SENTINEL in html


def test_download_data_page_works(admin_client):
    res = admin_client.get('/admin/download-data/')
    assert res.status_code == 200
    assert b'PII' in res.content


def test_download_data_csv_works(outreach_client):
    res = outreach_client.get('/admin/download-data/userstats.csv')
    assert res.status_code == 200
    assert res['Content-Type'] == 'text/csv'


def test_download_data_csv_is_inaccessible_to_non_staff_users(client, db):
    user = UserFactory()
    client.force_login(user)

    res = client.get('/admin/download-data/userstats.csv')
    assert res.status_code == 302
    assert res.url == f"/admin/login/?next=/admin/download-data/userstats.csv"
