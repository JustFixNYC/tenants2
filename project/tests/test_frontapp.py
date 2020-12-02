import pytest
from django.http import HttpResponse

from project import frontapp


@pytest.mark.parametrize(
    "url,auth_secret,expected",
    [
        ("/blarg", "", False),
        ("/blarg?auth_secret=", "", False),
        ("/blarg", "boop", False),
        ("/blarg?auth_secret=boop", "boop", True),
        ("/blarg?auth_secret=foo", "boop", False),
        ("/login?next=zzzzzzzzz", "boop", False),
        ("/login?next=%2Fblarg%3Fauth_secret%3Dboop", "boop", True),
        ("/login?next=%2Fblarg%3Fauth_secret%3Dfoo", "boop", False),
    ],
)
def test_does_url_have_auth_secret_works(url, auth_secret, expected):
    assert frontapp.does_url_have_auth_secret(url, auth_secret) is expected


@frontapp.embeddable_in_frontapp
def fake_view(request, foo, bar):
    return HttpResponse(f"NO U {foo} {bar}")


class TestEmbeddableInFrontapp:
    def get_csp_update(self, res):
        return getattr(res, "_csp_update", None)

    def test_it_adds_csp_headers_when_secret_is_present(self, rf, settings):
        settings.FRONTAPP_PLUGIN_AUTH_SECRET = "boop"
        req = rf.get("/blarh?auth_secret=boop")
        res = fake_view(req, 5, bar=1)
        assert res.content == b"NO U 5 1"
        assert self.get_csp_update(res) == {
            "frame-ancestors": ["https://*.frontapp.com", "https://*.frontapplication.com"]
        }

    def test_it_does_not_add_csp_headers_when_secret_is_absent(self, rf, settings):
        settings.FRONTAPP_PLUGIN_AUTH_SECRET = "boop"
        req = rf.get("/blarh")
        res = fake_view(req, 2, bar=6)
        assert res.content == b"NO U 2 6"
        assert self.get_csp_update(res) is None
