from project import middleware
import rollbar


class TestHostnameRedirectMiddleware:
    def test_it_works(self, client, settings):
        settings.HOSTNAME_REDIRECTS = {
            'foo.com': 'bar.com',
        }
        settings.MIDDLEWARE = ['project.middleware.hostname_redirect_middleware']

        res = client.get('/blarg?blarf=on', SERVER_NAME='foo.com')
        assert res.status_code == 302
        assert res['location'] == 'https://bar.com/blarg?blarf=on'

        res = client.get('/blarg?blarf=on', SERVER_NAME='bar.com')
        assert res.status_code == 404


class TestRollbarRequestMiddleware:
    def test_it_works(self, settings):
        def get_response(request):
            assert rollbar.get_request() == "FAKE REQUEST"
            return "FAKE RESPONSE"

        mw = middleware.rollbar_request_middleware(get_response)

        assert rollbar.get_request() is None
        assert mw("FAKE REQUEST") == "FAKE RESPONSE"
        assert rollbar.get_request() is None
