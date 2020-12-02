import pytest
from django.urls import path, include
from django.template import Template, RequestContext
from django.http import HttpResponse

from frontend.context_processors import safe_mode as ctx_processor


def show_safe_mode_snippet(request):
    template = Template(
        """
        {{ SAFE_MODE_SNIPPET }}
        {% include 'frontend/safe_mode_ui.html' %}
        """.strip()
    )
    return HttpResponse(template.render(RequestContext(request)))


urlpatterns = [
    path("snippet", show_safe_mode_snippet),
    path("safe-mode/", include("frontend.safe_mode")),
]


class FakeRequest:
    def __init__(self, **kwargs):
        self.session = kwargs


def test_ctx_processor_works_when_not_in_safe_mode():
    d = ctx_processor(FakeRequest())
    assert d["is_safe_mode_enabled"] is False
    assert "SAFE_MODE_SNIPPET" in d


def test_ctx_processor_works_when_in_safe_mode():
    d = ctx_processor(FakeRequest(enable_safe_mode=True))
    assert d["is_safe_mode_enabled"] is True
    assert "SAFE_MODE_SNIPPET" in d


# A string we know will be in the minified JS snippet.
JS_SENTINEL = "var SHOW_UI_DELAY_MS="

# A string we know will be in the history fix JS snippet.
HISTORY_FIX_JS_SENTINEL = "location.reload()"


def get_snippet_html(client):
    res = client.get("/snippet")
    assert res.status_code == 200
    return res.content.decode("utf-8")


def assert_html_is_not_in_safe_mode(html):
    assert JS_SENTINEL in html
    assert HISTORY_FIX_JS_SENTINEL not in html
    assert "Activate compatibility mode" in html


def assert_html_is_in_safe_mode(html):
    assert JS_SENTINEL not in html
    assert HISTORY_FIX_JS_SENTINEL in html
    assert "Deactivate compatibility mode" in html


def enable_safe_mode(client):
    session = client.session
    session["enable_safe_mode"] = True
    session.save()


@pytest.mark.urls(__name__)
def test_snippet_and_ui_work_when_not_in_safe_mode(client):
    assert_html_is_not_in_safe_mode(get_snippet_html(client))


@pytest.mark.django_db
@pytest.mark.urls(__name__)
def test_snippet_and_ui_work_when_in_safe_mode(client):
    enable_safe_mode(client)
    assert_html_is_in_safe_mode(get_snippet_html(client))


@pytest.mark.django_db
@pytest.mark.urls(__name__)
def test_activating_and_deactivating_safe_mode_works(django_app):
    response = django_app.get("/snippet")
    assert_html_is_not_in_safe_mode(response)
    response = response.form.submit().follow()

    assert response.status == "200 OK"
    assert_html_is_in_safe_mode(response)

    response = response.form.submit().follow()
    assert response.status == "200 OK"
    assert_html_is_not_in_safe_mode(response)
