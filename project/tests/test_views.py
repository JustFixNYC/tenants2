from unittest.mock import patch
import pytest

from project.views import get_initial_session, execute_query


def test_execute_query_raises_exception_on_errors(graphql_client):
    with pytest.raises(Exception) as exc_info:
        execute_query(graphql_client.request, 'bloop')
    assert 'bloop' in str(exc_info.value)


def test_get_initial_session_works(graphql_client):
    request = graphql_client.request
    assert len(get_initial_session(request)['csrfToken']) > 0


def test_index_works(client):
    response = client.get('/')
    assert response.status_code == 200
    assert 'JustFix.nyc' in response.context['title_tag']
    assert '<nav' in response.context['initial_render']


def test_pages_with_extra_bundles_work(client):
    response = client.get('/__loadable-example-page')
    assert response.status_code == 200
    assert response.context['bundle_urls'] == [
        '/static/frontend/example-loadable-page.bundle.js',
        '/static/frontend/main.bundle.js'
    ]


def test_pages_with_prerendered_modals_work(client):
    response = client.get('/__example-modal')
    assert response.status_code == 200
    assert 'jf-modal-dialog' in response.context['modal_html']

    # We need to make the main content hidden when pre-rendering,
    # or else the content behind the modal will be keyboard-navigable.
    # Perhaps someday when the "inert" attribute is widely supported,
    # we could use that instead.
    assert b'<div id="main" hidden' in response.content


def test_404_works(client):
    response = client.get('/nonexistent')
    assert response.status_code == 404


@patch('project.views.TEST_INTERNAL_SERVER_ERROR', True)
def test_500_works(client):
    response = client.get('/')
    assert response.status_code == 500
    assert response.context['bundle_urls'] == []
