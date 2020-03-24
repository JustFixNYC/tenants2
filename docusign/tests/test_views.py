import pytest
import urllib.parse
from django.urls import reverse_lazy

from docusign import core


CALLBACK_URL = reverse_lazy('docusign:callback')
CONSENT_URL = reverse_lazy('docusign:consent')
URLS = [CALLBACK_URL, CONSENT_URL]


@pytest.mark.parametrize('url', URLS)
def test_views_404_when_docusign_is_disabled(url, client):
    assert client.get(url).status_code == 404


@pytest.mark.parametrize('url', URLS)
def test_views_require_auth_when_docusign_is_enabled(url, client, mockdocusign):
    assert client.get(url).status_code == 302


class TestViews:
    @pytest.fixture(autouse=True)
    def setup(self, admin_client, mockdocusign):
        self.client = admin_client

    def test_it_returns_403_on_invalid_state(self):
        assert self.client.get(CALLBACK_URL).status_code == 403

    def test_consent_flow_works(self):
        res = self.client.get(CONSENT_URL)
        assert res.status_code == 302
        assert 'response_type=code' in res['Location']
        state = urllib.parse.parse_qs(res['Location'])['state'][0]
        code = "noice"
        res = self.client.get(f"{CALLBACK_URL}?code={code}&state={state}")
        assert res.status_code == 200
        assert b"Thank you for your consent" in res.content
        assert core.get_config().consent_code == code
