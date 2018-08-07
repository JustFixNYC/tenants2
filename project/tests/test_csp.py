EXPECTED_CSP = "default-src 'self'"


def test_csp_works_on_dynamic_pages(client):
    response = client.get('/')
    assert 200 == response.status_code
    assert EXPECTED_CSP == response['Content-Security-Policy']


def test_csp_works_on_static_assets(client):
    response = client.get('/static/frontend/styles.css')
    assert 200 == response.status_code
    assert EXPECTED_CSP == response['Content-Security-Policy']
