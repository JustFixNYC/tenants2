EXPECTED_CSP = "default-src 'self'"


def test_csp_works_on_dynamic_pages(client):
    response = client.get('/')
    assert 200 == response.status_code
    assert EXPECTED_CSP in response['Content-Security-Policy']


def test_csp_works_on_static_assets(client, staticfiles):
    assert (staticfiles / 'admin' / 'css' / 'base.css').exists()
    response = client.get('/static/admin/css/base.css')
    assert 200 == response.status_code
    assert EXPECTED_CSP in response['Content-Security-Policy']
