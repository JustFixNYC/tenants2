def test_index_works(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b"JustFix.nyc" in response.content
    assert b"data-reactroot" in response.content
