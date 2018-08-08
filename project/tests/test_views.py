import urllib.request


def test_index_works(live_server):
    # response = client.get('/')
    response = urllib.request.urlopen(live_server.url)
    assert response.getcode() == 200
    content = response.read()
    assert b"JustFix.nyc" in content
    assert b"data-reactroot" in content
    assert b"HALLO" in content
