import pytest
from django.http import HttpResponse
from django.urls import path
from csp.decorators import csp_update

from project.middleware import CSPHashingMiddleware


EXPECTED_CSP = "default-src 'self'"


def basic_view(request):
    return HttpResponse("hello")


def view_with_inline_script(request):
    script = 'console.log("hello")'
    request.allow_inline_script(script)
    return HttpResponse(f"<script>{script}</script>")


@csp_update(SCRIPT_SRC="https://blarg")
def view_with_everything(request):
    script = 'console.log("hello")'
    request.allow_inline_script(script)
    request.csp_update(SCRIPT_SRC="https://boop")
    return HttpResponse(f"<script>{script}</script>")


urlpatterns = [
    path("basic", basic_view),
    path("with-inline-script", view_with_inline_script),
    path("with-everything", view_with_everything),
]


def parse_csp_header(csp):
    parts = csp.split("; ")
    result = {}
    for part in parts:
        first_word, rest = part.split(" ", 1)
        result[first_word] = rest
    assert "'self'" in result["default-src"]
    return result


@pytest.mark.urls(__name__)
def test_csp_works_on_dynamic_pages(client):
    response = client.get("/basic")
    assert 200 == response.status_code
    assert response.content == b"hello"
    csp = response["Content-Security-Policy"]
    assert "'unsafe-inline'" not in parse_csp_header(csp)["script-src"]
    assert EXPECTED_CSP in csp


@pytest.mark.urls(__name__)
def test_hash_is_added_for_inline_scripts(client):
    response = client.get("/with-inline-script")
    assert 200 == response.status_code
    assert response.content == b'<script>console.log("hello")</script>'
    csp = response["Content-Security-Policy"]
    b64hash = "Ql3n7tC/2D6wSTlQY8RcOKXhq02zfdaSDviOhpvbYWw="
    assert f"'unsafe-inline' 'sha256-{b64hash}'" in csp
    assert EXPECTED_CSP in csp


@pytest.mark.urls(__name__)
def test_all_csp_directives_are_merged(client, settings):
    settings.CSP_SCRIPT_SRC = ["https://bam"]
    response = client.get("/with-everything")
    assert 200 == response.status_code
    assert (
        "script-src https://bam 'self' https://boop https://blarg "
        "'unsafe-inline' "
        "'sha256-Ql3n7tC/2D6wSTlQY8RcOKXhq02zfdaSDviOhpvbYWw='"
    ) in response["Content-Security-Policy"]


def test_csp_works_on_static_assets(client, staticfiles):
    assert (staticfiles / "admin" / "css" / "base.css").exists()
    response = client.get("/static/admin/css/base.css")
    assert 200 == response.status_code

    csp = response["Content-Security-Policy"]
    assert "'unsafe-inline'" not in parse_csp_header(csp)["script-src"]
    assert EXPECTED_CSP in csp


def test_merge_csp_updates_works():
    m = CSPHashingMiddleware(lambda request: None)
    assert m._merge_csp_updates([]) == {}
    assert m._merge_csp_updates(
        [
            {"script-src": "https://boop"},
            {"script-src": ["https://bap", "https://goo"]},
        ]
    ) == {"script-src": ["'self'", "https://boop", "https://bap", "https://goo"]}
