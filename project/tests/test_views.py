from unittest.mock import patch
import pytest
from django.urls import reverse

from project.views import (
    get_initial_session,
    execute_query,
    render_raw_lambda_static_content,
    get_enabled_locales,
    get_legacy_form_submission,
    get_language_from_url_or_default,
    fix_newlines,
    LegacyFormSubmissionError,
    FORMS_COMMON_DATA
)
import project.locales
from project.util.site_util import get_default_site
from project.graphql_static_request import GraphQLStaticRequest
from project.util.testing_util import ClassCachedValue
from users.tests.factories import UserFactory
from .util import qdict
from frontend.tests import test_safe_mode


@pytest.fixture(autouse=True)
def setup_fixtures(allow_lambda_http, db):
    pass


def react_url(path: str) -> str:
    base_url = reverse('react')
    if base_url.endswith('/'):
        base_url = base_url[:-1]
    return f"{base_url}{path}"


def test_get_enabled_locales_works():
    assert 'en' in get_enabled_locales()


def test_get_legacy_form_submission_raises_errors(graphql_client):
    request = graphql_client.request
    with pytest.raises(LegacyFormSubmissionError, match='No GraphQL query found'):
        get_legacy_form_submission(request)

    request.POST = qdict({'graphql': ['boop']})

    with pytest.raises(LegacyFormSubmissionError, match='Invalid GraphQL query'):
        get_legacy_form_submission(request)

    request.POST = qdict({'graphql': ['''
        mutation Foo($input: NonExistentInput!) { foo(input: $input) }
    ''']})

    with pytest.raises(LegacyFormSubmissionError, match='Invalid GraphQL input type'):
        get_legacy_form_submission(request)


def test_execute_query_raises_exception_on_errors(graphql_client):
    with pytest.raises(Exception) as exc_info:
        execute_query(graphql_client.request, 'bloop')
    assert 'bloop' in str(exc_info.value)


def test_get_initial_session_works(graphql_client):
    request = graphql_client.request
    assert len(get_initial_session(request)['csrfToken']) > 0


def test_post_is_processed_before_getting_initial_session(client, monkeypatch):
    # We're going to test this by making an invalid POST, which should be
    # processed and thus cause a 400, before the initial session is retrieved.

    # Because the initial session should not *ever* be retrieved, we can delete
    # the function that retrieves it.
    monkeypatch.delattr("project.views.get_initial_session")

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


@patch('project.views.TEST_INTERNAL_SERVER_ERROR', True)
def test_500_works(client):
    response = client.get(react_url('/'))
    assert response.status_code == 500
    assert response.context['script_tags'] == ''


def test_fix_newlines_works():
    assert fix_newlines({'boop': 'hello\r\nthere'}) == {'boop': 'hello\nthere'}


def unmunge_form_graphql(form):
    # Sometimes browsers will munge the newlines in our own
    # hidden inputs before submitting; let's make sure that
    # we account for that.
    assert '\r\n' not in form['graphql'].value
    assert '\n' in form['graphql'].value
    form['graphql'] = form['graphql'].value.replace('\n', '\r\n')


def test_form_submission_in_modal_redirects_on_success(django_app):
    form = django_app.get('/dev/examples/form/in-modal').forms[0]

    unmunge_form_graphql(form)
    form['exampleField'] = 'hi'
    response = form.submit()
    assert response.status == '302 Found'
    assert response['Location'] == '/dev/examples/form'


def test_form_submission_redirects_on_success(django_app):
    form = django_app.get('/dev/examples/form').forms[0]

    unmunge_form_graphql(form)
    form['exampleField'] = 'hi'
    response = form.submit()
    assert response.status == '302 Found'
    assert response['Location'] == react_url('/')


def test_form_submission_in_modal_shows_success_message(django_app):
    form = django_app.get('/dev/examples/form2/in-modal').forms[0]

    unmunge_form_graphql(form)
    form['exampleField'] = 'zzz'
    response = form.submit()
    assert response.status == '200 OK'
    assert 'the form was submitted successfully' in response
    assert 'hello there zzz' in response


def test_form_submission_shows_success_message(django_app):
    form = django_app.get('/dev/examples/form2').forms[0]

    unmunge_form_graphql(form)
    form['exampleField'] = 'yyy'
    response = form.submit()
    assert response.status == '200 OK'
    assert 'the form was submitted successfully' in response
    assert 'hello there yyy' in response


def test_form_submission_shows_errors(django_app):
    response = django_app.get('/dev/examples/form')
    assert response.status == '200 OK'

    form = response.forms[0]
    form['exampleField'] = 'hello there buddy'
    response = form.submit()

    assert response.status == '200 OK'
    form = response.forms[0]

    # Ensure the form preserves the input from our last submission.
    assert form['exampleField'].value == 'hello there buddy'

    assert 'Ensure this value has at most 5 characters (it has 17)' in response


class TestRadio:
    @pytest.fixture(autouse=True)
    def set_django_app(self, django_app):
        self.django_app = django_app
        self.form = self.django_app.get('/dev/examples/radio').forms[0]

    def test_it_works(self):
        self.form['radioField'] = 'A'
        response = self.form.submit()
        assert response.status == '302 Found'

    def test_it_shows_error_when_not_filled_out(self):
        response = self.form.submit()
        assert response.status == '200 OK'
        assert 'This field is required' in response


class TestFormsets:
    @pytest.fixture(autouse=True)
    def set_django_app(self, django_app):
        self.django_app = django_app
        self.form = self.django_app.get('/dev/examples/form').forms[0]
        # Make the non-formset fields valid. (Yes, this is a code smell.)
        self.form['exampleField'] = 'hi'

    def test_it_works(self):
        self.form['subforms-0-exampleField'] = 'boop'
        response = self.form.submit()
        assert response.status == '302 Found'

    def test_it_shows_non_field_errors(self):
        self.form['subforms-0-exampleField'] = 'NFIER'
        response = self.form.submit()
        assert response.status == '200 OK'
        assert 'This is an example non-field error' in response

    def test_it_shows_non_form_errors(self):
        self.form['subforms-0-exampleField'] = 'NFOER'
        response = self.form.submit()
        assert response.status == '200 OK'
        assert 'This is an example non-form error' in response
        assert 'CODE_NFOER' in response

    def test_it_shows_field_errors(self):
        self.form['subforms-0-exampleField'] = 'hello there buddy'
        response = self.form.submit()
        assert response.status == '200 OK'
        assert 'Ensure this value has at most 5 characters (it has 17)' in response

    def test_add_another_works(self):
        second_field = 'subforms-1-exampleField'
        assert second_field not in self.form.fields
        self.form['subforms-0-exampleField'] = 'boop'
        response = self.form.submit(FORMS_COMMON_DATA["LEGACY_FORMSET_ADD_BUTTON_NAME"])
        assert response.status == '200 OK'
        assert second_field in response.forms[0].fields


def test_form_submission_preserves_boolean_fields(django_app):
    form = django_app.get('/dev/examples/form').forms[0]

    assert form['boolField'].value is None
    form['boolField'] = True
    response = form.submit()

    assert response.status == '200 OK'
    form = response.forms[0]

    assert form['boolField'].value == 'on'
    form['boolField'] = False
    response = form.submit()

    assert response.status == '200 OK'
    form = response.forms[0]
    assert form['boolField'].value is None


@pytest.mark.django_db
def test_successful_login_redirects_to_next(django_app):
    UserFactory(phone_number='5551234567', password='test123')
    form = django_app.get(react_url('/login') + '?next=/boop').forms[0]

    form['phoneNumber'] = '5551234567'
    form['password'] = 'test123'
    response = form.submit()

    assert response.status == '302 Found'
    assert response['Location'] == 'http://testserver/boop'


@pytest.mark.django_db
def test_unsuccessful_login_shows_error(django_app):
    form = django_app.get(react_url('/login') + '?next=/boop').forms[0]

    form['phoneNumber'] = '5551234567'
    form['password'] = 'test123'
    response = form.submit()

    assert response.status == '200 OK'
    assert 'Invalid phone number or password' in response


def test_example_server_error_works(client):
    with pytest.raises(Exception, match="with id 'boop'"):
        client.post('/dev/examples/server-error/boop')


def test_favicon_works(client, staticfiles):
    res = client.get('/favicon.ico', follow=True)
    assert res.status_code == 200
    assert res['Content-Type'] == 'image/x-icon'


def test_health_works(db, client):
    res = client.get('/health')
    assert res.status_code == 200
    health = res.json()
    assert health['status'] == 200
    assert health['is_extended'] is False


def test_extended_health_works(db, client, settings):
    settings.EXTENDED_HEALTHCHECK_KEY = 'bloop'
    res = client.get('/health?extended=bloop')
    assert res.status_code == 200
    health = res.json()
    assert health['status'] == 200
    assert health['is_extended'] is True


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


class TestGraphQLStaticRequest:
    def test_get_initial_session_works_with_anonymous_user(self):
        request = GraphQLStaticRequest()
        session = get_initial_session(request)

        assert session['firstName'] is None
        assert session['csrfToken'] == ''
        assert session['isSafeModeEnabled'] is False
        assert request.session == {}

    def test_get_initial_session_works_with_authenticated_user(self, db):
        request = GraphQLStaticRequest(user=UserFactory())
        session = get_initial_session(request)

        assert session['firstName'] == 'Boop'
        assert session['csrfToken'] == ''
        assert session['isSafeModeEnabled'] is False
        assert request.session == {}
