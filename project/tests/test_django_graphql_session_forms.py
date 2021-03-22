from django import forms
import graphene

from project.util.django_graphql_session_forms import DjangoSessionFormObjectType


def test_extra_graphql_output_fields_are_processed():
    class MyForm(forms.Form):
        my_field = forms.CharField(max_length=25)

        extra_graphql_output_fields = {
            "my_extra_field": graphene.Boolean(required=True, description="hi")
        }

    class MyObj(DjangoSessionFormObjectType):
        class Meta:
            form_class = MyForm
            session_key = "huh"

    assert "my_field" in MyObj._meta.fields
    assert "my_extra_field" in MyObj._meta.fields
