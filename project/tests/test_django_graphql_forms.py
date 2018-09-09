import json
import graphene
from graphene.test import Client
from django import forms
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

from users.tests.factories import UserFactory
from ..util.django_graphql_forms import (
    DjangoFormMutation, get_input_type_from_query)


class FooForm(forms.Form):
    bar_field = forms.CharField()

    multi_field = forms.MultipleChoiceField(choices=[
        ('A', 'choice a'),
        ('B', 'choice b')
    ], required=False)

    def clean(self):
        cleaned_data = super().clean()
        multi_field = cleaned_data.get('multi_field')

        if multi_field:
            assert isinstance(multi_field, list)


class Foo(DjangoFormMutation):
    class Meta:
        form_class = FooForm

    baz_field = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info):
        return cls(baz_field=f"{form.cleaned_data['bar_field']} back")


class SimpleForm(forms.Form):
    some_field = forms.CharField()


class FormWithAuth(DjangoFormMutation):
    class Meta:
        form_class = SimpleForm

    login_required = True

    @classmethod
    def perform_mutate(cls, form, info):
        return cls()


class Mutations(graphene.ObjectType):
    foo = Foo.Field()
    form_with_auth = FormWithAuth.Field()


schema = graphene.Schema(mutation=Mutations)


def jsonify(obj):
    return json.loads(json.dumps(obj))


def execute_query(bar_field='blah', multi_field=None):
    if multi_field is None:
        multi_field = []
    client = Client(schema)
    input_var = {'barField': bar_field, 'multiField': multi_field}

    return jsonify(client.execute('''
    mutation MyMutation($input: FooInput!) {
        foo(input: $input) {
            bazField,
            errors {
                field,
                messages
            }
        }
    }
    ''', variables={'input': input_var}))


def execute_form_with_auth_query(some_field='HI', user=None):
    if user is None:
        user = AnonymousUser()
    req = RequestFactory().get('/')
    req.user = user

    client = Client(schema)
    input_var = {'someField': some_field}

    return jsonify(client.execute('''
    mutation MyMutation($input: FormWithAuthInput!) {
        formWithAuth(input: $input) {
            errors {
                field,
                messages
            }
        }
    }
    ''', variables={'input': input_var}, context_value=req))


def test_get_form_class_for_input_type_works():
    get = DjangoFormMutation.get_form_class_for_input_type
    assert get('LolInput') is None
    assert get('FormWithAuthInput') is SimpleForm


def test_muliple_choice_fields_accept_lists():
    result = execute_query(multi_field=['A', 'B'])
    assert result['data']['foo']['errors'] == []

    result = execute_query(multi_field=['A', 'b'])
    assert result['data']['foo']['errors'] == [{
        'field': 'multiField',
        'messages': [
            'Select a valid choice. b is not one of the available choices.'
        ]
    }]


def test_login_required_forms_fail_when_unauthenticated():
    assert execute_form_with_auth_query(user=None) == {
        'data': {
            'formWithAuth': {
                'errors': [{
                    'field': '__all__',
                    'messages': [
                        'You do not have permission to use this form!'
                    ]
                }]
            }
        }
    }


def test_login_required_forms_succeed_when_authenticated():
    assert execute_form_with_auth_query(user=UserFactory.build()) == {
        'data': {
            'formWithAuth': {
                'errors': []
            }
        }
    }


def test_valid_forms_return_data():
    assert execute_query(bar_field='HI') == {
        'data': {
            'foo': {
                'bazField': 'HI back',
                'errors': []
            }
        }
    }


def test_invalid_forms_return_camelcased_errors():
    assert execute_query(bar_field='') == {
        'data': {
            'foo': {
                'bazField': None,
                'errors': [
                    {'field': 'barField', 'messages': ['This field is required.']}
                ]
            }
        }
    }


def test_get_input_type_from_query_works():
    # Ensure non-nullable input works.
    assert get_input_type_from_query(
        'mutation Foo($input: BarInput!) { foo(input: $input) }') == 'BarInput'

    # Ensure nullable input works.
    assert get_input_type_from_query(
        'mutation Foo($input: BarInput) { foo(input: $input) }') == 'BarInput'

    # Ensure syntax errors return None.
    assert get_input_type_from_query('LOL') is None

    # Ensure queries w/o variable definitons work.
    assert get_input_type_from_query('query { blah }') is None

    # Ensure the variable definition must be for "input".
    assert get_input_type_from_query(
        'mutation Foo($boop: BarInput!) { foo(input: $boop) }') is None
