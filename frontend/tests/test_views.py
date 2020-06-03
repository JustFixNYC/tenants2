from unittest.mock import patch
import pytest

from frontend.views import (
    render_raw_lambda_static_content,
    get_enabled_locales,
    get_language_from_url_or_default,
)
import project.locales
from project.util.site_util import get_default_site
from project.util.testing_util import ClassCachedValue
from frontend.tests import test_safe_mode
from .util import react_url


@pytest.fixture(autouse=True)
def setup_fixtures(allow_lambda_http, db):
    pass


def test_get_enabled_locales_works():
    assert 'en' in get_enabled_locales()


def test_post_is_processed_before_getting_initial_session(client, monkeypatch):
    # We're going to test this by making an invalid POST, which should be
    # processed and thus cause a 400, before the initial session is retrieved.

    # Because the initial session should not *ever* be retrieved, we can delete
    # the function that retrieves it.
    monkeypatch.delattr("frontend.views.get_initial_session")

    response = client.post(react_url('/'))
    assert response.status_code == 400
    assert response.content == b'No GraphQL query found'


def test_invalid_post_returns_400(client):
    response = client.post(react_url('/'))
    assert response.status_code == 400
    assert response.content == b'No GraphQL query found'


# HTML we know will appear in pages only when safe mode is enabled/disabled.
SAFE_MODE_ENABLED_SENTINEL = "navbar-menu is-active"
SAFE_MODE_DISABLED_SENTINEL = 'src="/static/frontend/main'

# HTML we know will appear in pages only when analytics is enabled/disabled.
ENABLE_ANALYTICS_SENTINEL = '<meta name="enable-analytics" content="1">'
DISABLE_ANALYTICS_SENTINEL = '<meta name="enable-analytics" content="0">'


class TestIndexPage(ClassCachedValue):
    @pytest.fixture(autouse=True)
    def render_html(self, client):
        self.html = self.get_value(client=client)

    @classmethod
    def cache_value(cls, client):
        response = client.get(react_url('/'))
        assert response.status_code == 200
        return response.content.decode('utf-8')

    def test_html_lang_attr_is_set(self):
        assert '<html lang="en"' in self.html

    def test_locale_bundle_is_preloaded(self):
        assert 'src="/static/frontend/locales-en-base-chunk.' in self.html

    def test_analytics_are_enabled_by_default(self):
        assert ENABLE_ANALYTICS_SENTINEL in self.html
        assert DISABLE_ANALYTICS_SENTINEL not in self.html


def test_ecmascript_intl_api_works_on_server(client):
    response = client.get('/dev/examples/intl')
    assert response.status_code == 200
    html = response.content.decode('utf-8')
    assert 'Wednesday, May 27, 2020' in html
    assert 'miércoles, 27 de mayo de 2020' in html


def test_localized_pages_work(client, settings, use_norent_site):
    settings.LANGUAGES = project.locales.ALL.choices
    response = client.get('/es/faqs')
    assert response.status_code == 200
    html = response.content.decode('utf-8')
    assert '<html lang="es"' in html
    assert 'src="/static/frontend/locales-es-base-chunk.' in html
    assert 'src="/static/frontend/locales-es-norent-chunk.' in html
    assert 'crear mi carta' in html.lower()
    assert 'preguntas frecuentes' in html.lower()


def test_analytics_are_disabled_for_staff(admin_client):
    response = admin_client.get(react_url('/'))
    html = response.content.decode('utf-8')
    assert ENABLE_ANALYTICS_SENTINEL not in html
    assert DISABLE_ANALYTICS_SENTINEL in html


def test_index_works_when_not_in_safe_mode(client):
    response = client.get(react_url('/'))
    assert response.status_code == 200
    assert 'JustFix.nyc' in response.context['title_tag']
    assert '<nav' in response.context['initial_render']

    html = response.content.decode('utf-8')
    assert SAFE_MODE_ENABLED_SENTINEL not in html
    assert SAFE_MODE_DISABLED_SENTINEL in html
    test_safe_mode.assert_html_is_not_in_safe_mode(html)


@pytest.mark.django_db
def test_index_works_when_in_safe_mode(client):
    test_safe_mode.enable_safe_mode(client)
    response = client.get(react_url('/'))
    assert response.status_code == 200

    html = response.content.decode('utf-8')
    assert SAFE_MODE_ENABLED_SENTINEL in html
    assert SAFE_MODE_DISABLED_SENTINEL not in html
    test_safe_mode.assert_html_is_in_safe_mode(html)


def test_redirects_to_locale_work(client, settings):
    response = client.get('/')
    assert response.status_code == 302
    assert response['location'] == '/en/'


def test_pages_with_redirects_work(client):
    response = client.get('/dev/examples/redirect')
    assert response.status_code == 302
    assert response['location'] == react_url('/')


def test_static_html_pages_work(client):
    response = client.get('/dev/examples/static-page')
    assert response.status_code == 200
    assert response['content-type'] == 'text/html; charset=utf-8'
    assert response.content.decode("utf-8") == (
        '<!DOCTYPE html>'
        '<html><meta charSet="utf-8"/>'
        '<title>This is an example static HTML page.</title>'
        '<p>Hello, this is an example static HTML page\u2026</p>'
        '<p>This is another paragraph.</p>'
        '</html>'
    )


def test_static_plaintext_pages_work(client):
    response = client.get('/dev/examples/static-page.txt')
    assert response.status_code == 200
    assert response['content-type'] == 'text/plain; charset=utf-8'
    assert response.content.decode("utf-8") == (
        'Hello, this is an example static plaintext page\u2026\n\n'
        'This is another paragraph.'
    )


def test_static_pdf_pages_work(client):
    response = client.get('/dev/examples/static-page.pdf')
    assert response.status_code == 200
    assert response['content-type'] == 'application/pdf'


def test_pages_with_extra_bundles_work(client):
    response = client.get('/dev/examples/loadable-page')
    assert response.status_code == 200
    script_tags = response.context['script_tags']
    assert 'src="/static/frontend/dev-dev.' in script_tags
    assert 'src="/static/frontend/example-loadable-page.' in script_tags
    assert 'src="/static/frontend/main.' in script_tags


def test_pages_with_meta_tags_work(client):
    response = client.get('/dev/examples/meta-tag')
    assert response.status_code == 200
    assert 'property="boop"' in response.context['meta_tags']
    assert b'property="boop"' in response.content


def test_pages_with_prerendered_modals_work(client):
    response = client.get('/dev/examples/modal')
    assert response.status_code == 200
    assert 'jf-modal-dialog' in response.context['modal_html']

    # We need to make the main content hidden when pre-rendering,
    # or else the content behind the modal will be keyboard-navigable.
    # Perhaps someday when the "inert" attribute is widely supported,
    # we could use that instead.
    assert b'<div id="main" hidden' in response.content


def test_pages_with_prefetched_graphql_queries_work(client):
    response = client.get('/dev/examples/query')
    assert response.status_code == 200
    s = "Output of example query is <code>Hello blah</code>!"
    assert s in response.context['initial_render']


def test_404_works(client):
    response = client.get(react_url('/nonexistent'))
    assert response.status_code == 404


@patch('frontend.views.TEST_INTERNAL_SERVER_ERROR', True)
def test_500_works(client):
    response = client.get(react_url('/'))
    assert response.status_code == 500
    assert response.context['script_tags'] == ''


def test_render_raw_lambda_static_content_works(db):
    lr = render_raw_lambda_static_content(
        '/dev/examples/static-page.pdf',
        site=get_default_site(),
    )
    assert lr is not None
    assert "<!DOCTYPE html>" in lr.html
    assert "This is an example static PDF page" in lr.html


def test_render_raw_lambda_static_content_returns_none_on_error(db):
    lr = render_raw_lambda_static_content('/blarfle', site=get_default_site())
    assert lr is None


@pytest.mark.parametrize("url,locale", [
    ("/dev/stuff", "en"),
    ("/en/stuff", "en"),
    ("/es/stuff", "es"),
    ("/fr/stuff", "en"),
])
def test_get_language_from_url_or_default(url, locale, settings):
    settings.LANGUAGES = [
        ('en', 'English'),
        ('es', 'Spanish'),
    ]
    assert get_language_from_url_or_default(url) == locale
