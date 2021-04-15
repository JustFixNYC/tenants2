import pytest
from django.urls import path
from django.template import RequestContext
from django.template import Template
from django.http import HttpResponse

from project.context_processors import (
    ga_snippet,
    gtm_snippet,
    gtm_noscript_snippet,
    rollbar_snippet,
    facebook_pixel_snippet,
    facebook_pixel_noscript_snippet,
)


def make_snippet_view(var_name):
    def view(request):
        template = Template("{{ " + var_name + " }}")
        return HttpResponse(template.render(RequestContext(request)))

    return view


urlpatterns = [
    path("ga", make_snippet_view("GA_SNIPPET")),
    path("gtm", make_snippet_view("GTM_SNIPPET")),
    path("gtm-noscript", make_snippet_view("GTM_NOSCRIPT_SNIPPET")),
    path("facebook-pixel", make_snippet_view("FACEBOOK_PIXEL_SNIPPET")),
    path("facebook-pixel-noscript", make_snippet_view("FACEBOOK_PIXEL_NOSCRIPT_SNIPPET")),
    path("rollbar", make_snippet_view("ROLLBAR_SNIPPET")),
]


@pytest.mark.parametrize(
    "context_processor",
    [
        ga_snippet,
        gtm_snippet,
        gtm_noscript_snippet,
        rollbar_snippet,
        facebook_pixel_snippet,
        facebook_pixel_noscript_snippet,
    ],
)
def test_contexts_are_empty_when_associated_setting_is_empty(context_processor):
    assert context_processor(None) == {}


def ensure_response_sets_csp(res, *args):
    csp = res["Content-Security-Policy"]
    assert f"'unsafe-inline' 'sha256-" in csp
    for arg in args:
        assert arg in csp


@pytest.mark.urls(__name__)
def test_ga_snippet_works(client, settings):
    settings.GA_TRACKING_ID = "UA-1234"
    res = client.get("/ga")
    assert res.status_code == 200
    html = res.content.decode("utf-8")
    assert "UA-1234" in html
    ensure_response_sets_csp(res, "google-analytics.com")


@pytest.mark.urls(__name__)
def test_gtm_snippets_work(client, settings):
    settings.GTM_CONTAINER_ID = "GTM-1234567"
    res = client.get("/gtm")
    assert res.status_code == 200
    html = res.content.decode("utf-8")
    assert "GTM-1234567" in html
    ensure_response_sets_csp(res, "googletagmanager.com")

    res = client.get("/gtm-noscript")
    assert res.status_code == 200
    html = res.content.decode("utf-8")
    assert "GTM-1234567" in html


@pytest.mark.urls(__name__)
def test_facebook_pixel_snippets_work(client, settings):
    settings.FACEBOOK_PIXEL_ID = "1234567"
    res = client.get("/facebook-pixel")
    assert res.status_code == 200
    html = res.content.decode("utf-8")
    assert "1234567" in html
    ensure_response_sets_csp(res, "connect.facebook.net")
    ensure_response_sets_csp(res, "www.facebook.com")

    res = client.get("/facebook-pixel-noscript")
    assert res.status_code == 200
    html = res.content.decode("utf-8")
    assert "tr?id=1234567" in html


@pytest.mark.urls(__name__)
def test_rollbar_snippet_works(client, settings):
    def get_html():
        res = client.get("/rollbar")
        assert res.status_code == 200
        return (res, res.content.decode("utf-8"))

    settings.ROLLBAR_ACCESS_TOKEN = "boop"
    res, html = get_html()
    assert 'accessToken: "boop"' in html
    assert 'environment: "production"' in html
    ensure_response_sets_csp(res, "rollbar.com")

    settings.DEBUG = True
    res, html = get_html()
    assert 'environment: "development"' in html


def test_rollbar_js_url_exists(staticfiles, client):
    url = rollbar_snippet.get_context()["rollbar_js_url"]
    res = client.get(url)
    assert res.status_code == 200
    # Weird, this used to be application/javascript but upgrading one
    # of our dependencies changed it to text/javascript; apparently this
    # is what servers are expected to serve JS as now, as of e.g.
    # https://html.spec.whatwg.org/multipage/scripting.html#scriptingLanguages
    assert res["Content-Type"] == 'text/javascript; charset="utf-8"'
