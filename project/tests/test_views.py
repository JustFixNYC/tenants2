from project.views import get_initial_session


def test_get_initial_session_works(graphql_client):
    request = graphql_client.request
    assert len(get_initial_session(request)['csrfToken']) > 0


def test_index_works(client):
    response = client.get('/')
    assert response.status_code == 200
    assert 'JustFix.nyc' in response.context['title_tag']
    assert '<nav' in response.context['initial_render']


def test_404_works(client):
    response = client.get('/nonexistent')
    assert response.status_code == 404
