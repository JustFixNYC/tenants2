import json
import graphene
from unittest.mock import patch
from dataclasses import dataclass
from typing import Any
import pytest
from graphene.test import Client
from django import forms
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

from users.tests.factories import UserFactory
from ..util.django_graphql_forms import (
    DjangoFormMutation,
    get_input_type_from_query,
    convert_post_data_to_input,
    logger
)
from .util import qdict


@dataclass
class FakeResolveInfo:
    field_name: Any
    context: Any


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


class MutationWithFormsets(DjangoFormMutation):
    class Meta:
        formset_classes = {
            'simples': forms.formset_factory(SimpleForm)
        }

    output = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info):
        output = ' '.join(
            f.cleaned_data['some_field']
            for f in form.formsets['simples']
        )
        return cls(errors=[], output=output)


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
    mutation_with_formsets = MutationWithFormsets.Field()


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
    ''', variables={'input': input_var}, context_value=create_fake_request()))


def create_fake_request(user=None):
    if user is None:
        user = AnonymousUser()
    req = RequestFactory().get('/')
    req.user = user
    return req


def execute_form_with_auth_query(some_field='HI', user=None):
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
    ''', variables={'input': input_var}, context_value=create_fake_request(user)))


def execute_formsets_query(simples):
    client = Client(schema)
    input_var = {'simples': simples}

    return jsonify(client.execute('''
    mutation MyFormsetMutation($input: MutationWithFormsetsInput!) {
        mutationWithFormsets(input: $input) {
            output,
            errors {
                field,
                messages
            }
        }
    }
    ''', variables={'input': input_var}, context_value=create_fake_request()))


def test_formsets_query_works():
    result = execute_formsets_query([
        {'someField': 'hello'},
        {'someField': 'there'},
    ])
    assert result == {
        'data': {'mutationWithFormsets': {
            'output': 'hello there',
            'errors': []
        }}
    }


def test_formsets_query_reports_errors():
    result = execute_formsets_query([
        {'someField': 'hello'},
        {'someField': ''},
    ])
    assert result == {
        'data': {'mutationWithFormsets': {
            'output': None,
            'errors': [{
                'field': 'simples.1.someField',
                'messages': ['This field is required.']
            }]
        }}
    }


def test_error_is_raised_when_fields_conflict():
    with pytest.raises(AssertionError, match='multiple definitions for "some_field" exist'):
        class ConflictingMutation(DjangoFormMutation):
            class Meta:
                form_class = SimpleForm
                formset_classes = {
                    'some_field': forms.formset_factory(SimpleForm)
                }


def test_log_works_with_anonymous_users():
    with patch.object(logger, 'info') as mock:
        DjangoFormMutation.log(FakeResolveInfo('blorf', create_fake_request()), 'boop')
        mock.assert_called_once_with('[blorf mutation] boop')


@pytest.mark.django_db
def test_log_works_with_logged_in_users():
    user = UserFactory(username='blarg')
    with patch.object(logger, 'info') as mock:
        DjangoFormMutation.log(FakeResolveInfo('blorf', create_fake_request(user)), 'boop')
        mock.assert_called_once_with(f'[blorf mutation user=blarg] boop')


def test_get_form_class_for_input_type_works():
    get = DjangoFormMutation.get_form_class_for_input_type
    assert get('LolInput') is None
    assert get('FormWithAuthInput') is SimpleForm


def test_convert_post_data_to_input_ignores_irrelevant_fields():
    class NullForm(forms.Form):
        pass

    assert convert_post_data_to_input(NullForm, qdict({'blah': ['z']})) == {}


def test_convert_post_data_to_input_works_with_date_fields():
    class DateForm(forms.Form):
        date1 = forms.DateField()

    assert convert_post_data_to_input(DateForm, qdict({
        'date1': ['2018-09-23'],
    })) == {'date1': '2018-09-23'}

    assert convert_post_data_to_input(DateForm, qdict({
        'date1': ['I AM NOT A DATE'],
    })) == {'date1': 'I AM NOT A DATE'}

    assert convert_post_data_to_input(DateForm, qdict()) == {'date1': None}


def test_convert_post_data_to_input_works_with_char_fields():
    assert convert_post_data_to_input(SimpleForm, qdict({
        'someField': ['boop'],
    })) == {'someField': 'boop'}

    assert convert_post_data_to_input(SimpleForm, qdict({
        'someField': [''],
    })) == {'someField': ''}

    assert convert_post_data_to_input(SimpleForm, qdict()) == {'someField': None}


def test_convert_post_data_to_input_works_with_multi_choice_fields():
    class MultiChoiceForm(forms.Form):
        field = forms.MultipleChoiceField(choices=[
            ('CHOICE_A', 'Choice A'),
            ('CHOICE_B', 'Choice B')
        ])

    assert convert_post_data_to_input(MultiChoiceForm, qdict()) == {'field': []}

    assert convert_post_data_to_input(MultiChoiceForm, qdict({
        'field': ['CHOICE_A']
    })) == {'field': ['CHOICE_A']}

    assert convert_post_data_to_input(MultiChoiceForm, qdict({
        'field': ['CHOICE_A', 'CHOICE_B']
    })) == {'field': ['CHOICE_A', 'CHOICE_B']}


def test_convert_post_data_to_input_works_with_bool_fields():
    class BoolForm(forms.Form):
        bool_field = forms.BooleanField()

    assert convert_post_data_to_input(BoolForm, qdict()) == {'boolField': False}
    assert convert_post_data_to_input(BoolForm, qdict({
        'boolField': ['on']
    })) == {'boolField': True}


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
