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
