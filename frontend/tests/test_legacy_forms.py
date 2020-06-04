import pytest

from users.tests.factories import UserFactory
from project.tests.util import qdict
from frontend.legacy_forms import (
    fix_newlines,
    LegacyFormSubmissionError,
    get_legacy_form_submission,
    FORMS_COMMON_DATA
)
from .util import react_url


@pytest.fixture(autouse=True)
def setup_fixtures(allow_lambda_http, db):
    pass


def unmunge_form_graphql(form):
    # Sometimes browsers will munge the newlines in our own
    # hidden inputs before submitting; let's make sure that
    # we account for that.
    assert '\r\n' not in form['graphql'].value
    assert '\n' in form['graphql'].value
    form['graphql'] = form['graphql'].value.replace('\n', '\r\n')


def test_fix_newlines_works():
    assert fix_newlines({'boop': 'hello\r\nthere'}) == {'boop': 'hello\nthere'}


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
