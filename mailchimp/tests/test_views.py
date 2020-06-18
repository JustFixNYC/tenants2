import pytest


SUBSCRIBE_PATH = '/mailchimp/subscribe'


@pytest.fixture
def mailchimp(settings):
    settings.MAILCHIMP_API_KEY = 'boop'
    settings.MAILCHIMP_CORS_ORIGINS = ['https://www.justfix.nyc']
    settings.MAILCHIMP_LIST_ID = '1234'


class TestSubscribe:
    def test_it_returns_404_when_mailchimp_is_disabled(
        self, client, disable_locale_middleware
    ):
        assert client.post(SUBSCRIBE_PATH).status_code == 404

    def test_it_returns_docs_on_get(self, client, mailchimp):
        res = client.get(SUBSCRIBE_PATH)
        assert res.status_code == 200
        assert b'Mailchimp subscribe API documentation' in res.content

    def test_post_returns_403_on_invalid_origin(self, client, mailchimp):
        res = client.post(SUBSCRIBE_PATH, data={}, headers={
            'Origin': 'https://mysite.com'
        })
        assert res.status_code == 403
        assert res.json() == {
            'status': 403,
            'errorCode': 'INVALID_ORIGIN',
        }
