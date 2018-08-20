import json
import graphene
from graphene.test import Client
from django import forms

from ..util.django_graphql_forms import DjangoFormMutation


class FooForm(forms.Form):
    bar_field = forms.CharField()


class Foo(DjangoFormMutation):
    class Meta:
        form_class = FooForm

    baz_field = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info):
        return cls(baz_field=f"{form.cleaned_data['bar_field']} back", errors=[])


class Mutations(graphene.ObjectType):
    foo = Foo.Field()


schema = graphene.Schema(mutation=Mutations)


def jsonify(obj):
    return json.loads(json.dumps(obj))


def query(bar_field):
    return '''
    mutation {
        foo(input: {barField: "%s"}) {
            bazField,
            errors {
                field,
                messages
            }
        }
    }
    ''' % bar_field


def test_valid_forms_return_data():
    client = Client(schema)
    assert jsonify(client.execute(query('HI'))) == {
        'data': {
            'foo': {
                'bazField': 'HI back',
                'errors': []
            }
        }
    }


def test_invalid_forms_return_camelcased_errors():
    client = Client(schema)
    assert jsonify(client.execute(query(''))) == {
        'data': {
            'foo': {
                'bazField': None,
                'errors': [
                    {'field': 'barField', 'messages': ['This field is required.']}
                ]
            }
        }
    }
