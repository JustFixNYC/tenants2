from project.util.success_url import get_success_url


class TestGetSuccessUrl:
    def test_it_accepts_valid_get_params(self, rf):
        req = rf.get('/', {'next': '/blah'})
        assert get_success_url(req) == '/blah'

    def test_it_accepts_valid_post_params(self, rf):
        req = rf.post('/', {'next': '/blah'})
        assert get_success_url(req) == '/blah'

    def test_it_rejects_invalid_urls(self, rf):
        req = rf.get('/', {'next': 'http://evil/thing'})
        assert get_success_url(req) == '/'
