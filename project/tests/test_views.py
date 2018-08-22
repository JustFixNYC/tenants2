from project.views import get_initial_session


def test_get_initial_session_works(graphql_client):
    request = graphql_client.request
    assert len(get_initial_session(request)['csrfToken']) > 0


def test_index_works(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'<title data-react-helmet="true">JustFix.nyc' in response.content
    assert b"JustFix.nyc" in response.content
    assert b"data-reactroot" in response.content


def test_404_works(client):
    response = client.get('/nonexistent')
    assert response.status_code == 404
