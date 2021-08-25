import pytest

from .factories import LinkFactory


@pytest.mark.parametrize("slug", ["hca", "HCA", "hca-is_K00L"])
def test_redirect_works(db, client, slug):
    LinkFactory(slug=slug)
    res = client.get(f"/s/{slug}")
    assert res.status_code == 302
    assert res["Location"] == "http://housingcourtanswers.org/"


def test_client_redirect_defaults_to_lowercase(db, client):
    LinkFactory(slug="hca")
    res = client.get(f"/s/HcA")
    assert res.status_code == 302
    assert res["Location"] == "http://housingcourtanswers.org/"


def test_redirect_404s_on_invalid_slug(db, client, disable_locale_middleware):
    res = client.get("/s/hca")
    assert res.status_code == 404
