import pytest

from .factories import LegacyUserInfoFactory
from .test_mongo import get_autologin_doc


class TestRedirectToLegacyApp:
    def test_returns_400_if_not_configured(self, admin_client):
        res = admin_client.get('/legacy-app')
        assert res.status_code == 400
        assert res.content == b'Legacy app integration is disabled.'

    def test_requires_login(self, client):
        res = client.get('/legacy-app')
        assert res.status_code == 302
        assert res['location'] == '/login?next=/legacy-app'

    def test_returns_400_if_user_is_not_legacy(self, admin_client, mock_mongodb):
        res = admin_client.get('/legacy-app')
        assert res.status_code == 400
        assert res.content == b'User is not a legacy user.'

    @pytest.mark.django_db
    def test_redirects_if_user_is_legacy(self, client, mock_mongodb):
        info = LegacyUserInfoFactory()
        client.force_login(info.user)
        res = client.get('/legacy-app')
        key = get_autologin_doc(mock_mongodb)['key']
        assert res.status_code == 302
        assert res['location'] == f'https://fake-legacy-app/auto-signin?key={key}'
