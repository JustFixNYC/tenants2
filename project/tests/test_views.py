import pytest


def test_example_server_error_works(client):
    with pytest.raises(Exception, match="with id 'boop'"):
        client.post("/dev/examples/server-error/boop")


def test_favicon_works(client, staticfiles):
    res = client.get("/favicon.ico", follow=True)
    assert res.status_code == 200
    assert res["Content-Type"] == "image/x-icon"


def test_health_works(db, client):
    res = client.get("/health")
    assert res.status_code == 200
    health = res.json()
    assert health["status"] == 200
    assert health["is_extended"] is False


def test_extended_health_works(db, client, settings):
    settings.EXTENDED_HEALTHCHECK_KEY = "bloop"
    res = client.get("/health?extended=bloop")
    assert res.status_code == 200
    health = res.json()
    assert health["status"] == 200
    assert health["is_extended"] is True


@pytest.mark.parametrize("url", ["/en-US/", "/en-us/", "/en-US/blarg"])
def test_it_redirects_en_us(client, url):
    res = client.get(url)
    assert res.status_code == 302
    assert res["Location"] == "/en/"
