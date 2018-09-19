import pytest
from django.http import HttpResponse
from django.urls import path

EXPECTED_CSP = "default-src 'self'"


def basic_view(request):
    return HttpResponse('hello')


def view_with_inline_script(request):
    script = 'console.log("hello")'
    request.allow_inline_script(script)
    return HttpResponse(f'<script>{script}</script>')


urlpatterns = [
    path('basic', basic_view),
    path('with-inline-script', view_with_inline_script),
]


@pytest.mark.urls(__name__)
def test_csp_works_on_dynamic_pages(client):
    response = client.get('/basic')
    assert 200 == response.status_code
    assert response.content == b'hello'
    csp = response['Content-Security-Policy']
    assert 'unsafe-inline' not in csp
    assert EXPECTED_CSP in csp


@pytest.mark.urls(__name__)
def test_hash_is_added_for_inline_scripts(client):
    response = client.get('/with-inline-script')
    assert 200 == response.status_code
    assert response.content == b'<script>console.log("hello")</script>'
    csp = response['Content-Security-Policy']
    b64hash = 'Ql3n7tC/2D6wSTlQY8RcOKXhq02zfdaSDviOhpvbYWw='
    assert f"'unsafe-inline' 'sha256-{b64hash}'" in csp
    assert EXPECTED_CSP in csp


def test_csp_works_on_static_assets(client, staticfiles):
    assert (staticfiles / 'admin' / 'css' / 'base.css').exists()
    response = client.get('/static/admin/css/base.css')
    assert 200 == response.status_code

    csp = response['Content-Security-Policy']
    assert 'unsafe-inline' not in csp
    assert EXPECTED_CSP in csp
