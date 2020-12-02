import json
import logging
import graphene
from unittest.mock import patch
from dataclasses import dataclass
from typing import Any
import pytest
from graphene.test import Client
from django import forms
from django.core.exceptions import ValidationError
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

from users.tests.factories import UserFactory
from ..util.django_graphql_forms import (
    DjangoFormMutation,
    DjangoFormQuery,
    get_input_type_from_query,
    convert_post_data_to_input,
    convert_post_data_to_form_data,
    convert_post_data_to_formset_data,
    logger,
)
from .util import qdict


@dataclass
class FakeResolveInfo:
    field_name: Any
    context: Any


class FooForm(forms.Form):
    bar_field = forms.CharField()

    multi_field = forms.MultipleChoiceField(
        choices=[("A", "choice a"), ("B", "choice b")], required=False
    )

    def clean(self):
        cleaned_data = super().clean()
        multi_field = cleaned_data.get("multi_field")

        if cleaned_data.get("bar_field") == "ERR_WITHOUT_CODE":
            raise ValidationError("error without code")

        if multi_field:
            assert isinstance(multi_field, list)


class Foo(DjangoFormMutation):
    class Meta:
        form_class = FooForm

    baz_field = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info):
        if form.cleaned_data["bar_field"] == "MAKE_ERROR":
            return cls.make_error("This error was created by make_error().", code="make_error")
        return cls(baz_field=f"{form.cleaned_data['bar_field']} back")


class SimpleForm(forms.Form):
    some_field = forms.CharField()

    some_field_to_exclude = forms.CharField(required=False)


class MutationWithFormsets(DjangoFormMutation):
    class Meta:
        exclude_fields = ["some_field_to_exclude"]

        formset_classes = {"simples": forms.formset_factory(SimpleForm)}

    output = graphene.String()

    @classmethod
    def perform_mutate(cls, form, info):
        output = " ".join(f.cleaned_data["some_field"] for f in form.formsets["simples"])
        return cls(errors=[], output=output)


class FormWithAuth(DjangoFormMutation):
    class Meta:
        exclude_fields = ["some_field_to_exclude"]

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


def execute_query(bar_field="blah", multi_field=None, errors="field, messages"):
    if multi_field is None:
        multi_field = []
    client = Client(schema)
    input_var = {"barField": bar_field, "multiField": multi_field}

    return jsonify(
        client.execute(
            """
    mutation MyMutation($input: FooInput!) {
        foo(input: $input) {
            bazField,
            errors {
                %(errors)s
            }
        }
    }
    """
            % {"errors": errors},
            variables={"input": input_var},
            context=create_fake_request(),
        )
    )


def create_fake_request(user=None):
    if user is None:
        user = AnonymousUser()
    req = RequestFactory().get("/")
    req.user = user
    return req


def execute_form_with_auth_query(some_field="HI", user=None):
    client = Client(schema)
    input_var = {"someField": some_field}

    return jsonify(
        client.execute(
            """
    mutation MyMutation($input: FormWithAuthInput!) {
        formWithAuth(input: $input) {
            errors {
                field,
                messages
            }
        }
    }
    """,
            variables={"input": input_var},
            context=create_fake_request(user),
        )
    )


def execute_formsets_query(simples, errors="field, messages"):
    client = Client(schema)
    input_var = {"simples": simples}

    return jsonify(
        client.execute(
            """
    mutation MyFormsetMutation($input: MutationWithFormsetsInput!) {
        mutationWithFormsets(input: $input) {
            output,
            errors {
                %(errors)s
            }
        }
    }
    """
            % {"errors": errors},
            variables={"input": input_var},
            context=create_fake_request(),
        )
    )


class TestDjangoFormQuery:
    @pytest.fixture(autouse=True)
    def setup_schema(self):
        class FormQueryForm(forms.Form):
            my_field = forms.CharField(max_length=5)

        class FormQuery(DjangoFormQuery):
            class Meta:
                form_class = FormQueryForm

            response = graphene.String()

            @classmethod
            def perform_query(cls, form, info):
                return cls(response=f"hello there from query {form.cleaned_data['my_field']}")

        class Queries(graphene.ObjectType):
            form_query = FormQuery.Field()

        self.schema = graphene.Schema(query=Queries)
        self.client = Client(self.schema)

    def request(self, input):
        response = jsonify(
            self.client.execute(
                """
        query MyQuery($input: FormQueryInput!) {
            formQuery(input: $input) {
                errors {
                    field,
                    extendedMessages { message, code }
                },
                response
            }
        }
        """,
                variables={"input": input},
                context=create_fake_request(),
            )
        )
        return response["data"]["formQuery"]

    def test_it_works(self):
        assert self.request({"myField": "boop"}) == {
            "errors": [],
            "response": "hello there from query boop",
        }

    def test_it_returns_errors(self):
        assert self.request({"myField": "boooop"}) == {
            "errors": [
                {
                    "field": "myField",
                    "extendedMessages": [
                        {
                            "code": "max_length",
                            "message": "Ensure this value has at most 5 characters (it has 6).",
                        }
                    ],
                }
            ],
            "response": None,
        }


def test_formsets_query_works():
    result = execute_formsets_query(
        [
            {"someField": "hello"},
            {"someField": "there"},
        ]
    )
    assert result == {"data": {"mutationWithFormsets": {"output": "hello there", "errors": []}}}


def test_formsets_query_reports_errors():
    result = execute_formsets_query(
        [
            {"someField": "hello"},
            {"someField": ""},
        ]
    )
    assert result == {
        "data": {
            "mutationWithFormsets": {
                "output": None,
                "errors": [
                    {"field": "simples.1.someField", "messages": ["This field is required."]}
                ],
            }
        }
    }


def test_formsets_query_reports_extended_errors():
    result = execute_formsets_query(
        [
            {"someField": "hello"},
            {"someField": ""},
        ],
        errors="field, extendedMessages { message, code }",
    )
    assert result == {
        "data": {
            "mutationWithFormsets": {
                "output": None,
                "errors": [
                    {
                        "field": "simples.1.someField",
                        "extendedMessages": [
                            {"message": "This field is required.", "code": "required"}
                        ],
                    }
                ],
            }
        }
    }


def test_error_is_raised_when_fields_conflict():
    with pytest.raises(AssertionError, match='multiple definitions for "some_field" exist'):

        class ConflictingMutation(DjangoFormMutation):
            class Meta:
                form_class = SimpleForm
                formset_classes = {"some_field": forms.formset_factory(SimpleForm)}


def test_log_works_with_anonymous_users():
    with patch.object(logger, "log") as mock:
        DjangoFormMutation.log(FakeResolveInfo("blorf", create_fake_request()), "boop")
        mock.assert_called_once_with(logging.INFO, "[blorf mutation] boop")


@pytest.mark.django_db
def test_log_works_with_logged_in_users():
    user = UserFactory(username="blarg")
    with patch.object(logger, "log") as mock:
        DjangoFormMutation.log(FakeResolveInfo("blorf", create_fake_request(user)), "boop")
        mock.assert_called_once_with(logging.INFO, f"[blorf mutation user=blarg] boop")


def test_get_form_class_for_input_type_works():
    get = DjangoFormMutation.get_form_class_for_input_type
    assert get("LolInput") is None
    assert get("FormWithAuthInput") is SimpleForm


def test_convert_post_data_to_input_ignores_irrelevant_fields():
    class NullForm(forms.Form):
        pass

    assert convert_post_data_to_input(NullForm, qdict({"blah": ["z"]})) == {}


def test_convert_post_data_to_input_works_with_date_fields():
    class DateForm(forms.Form):
        date1 = forms.DateField()

    assert (
        convert_post_data_to_input(
            DateForm,
            qdict(
                {
                    "date1": ["2018-09-23"],
                }
            ),
        )
        == {"date1": "2018-09-23"}
    )

    assert (
        convert_post_data_to_input(
            DateForm,
            qdict(
                {
                    "date1": ["I AM NOT A DATE"],
                }
            ),
        )
        == {"date1": "I AM NOT A DATE"}
    )

    assert convert_post_data_to_input(DateForm, qdict()) == {"date1": None}


def test_convert_post_data_to_input_works_with_char_fields_and_excludes():
    class CharForm(forms.Form):
        some_field = forms.CharField()

    assert (
        convert_post_data_to_input(
            CharForm,
            qdict(
                {
                    "someField": ["boop"],
                }
            ),
        )
        == {"someField": "boop"}
    )

    assert (
        convert_post_data_to_input(
            CharForm,
            qdict(
                {
                    "someField": [""],
                }
            ),
        )
        == {"someField": ""}
    )

    assert convert_post_data_to_input(CharForm, qdict()) == {"someField": None}


def test_convert_post_data_to_input_excludes_fields():
    class MyForm(forms.Form):
        foo_field = forms.CharField()
        bar_field = forms.CharField()

    assert convert_post_data_to_input(MyForm, qdict(), exclude_fields=["bar_field"]) == {
        "fooField": None,
    }


def test_convert_post_data_to_input_works_with_multi_choice_fields():
    class MultiChoiceForm(forms.Form):
        field = forms.MultipleChoiceField(
            choices=[("CHOICE_A", "Choice A"), ("CHOICE_B", "Choice B")]
        )

    assert convert_post_data_to_input(MultiChoiceForm, qdict()) == {"field": []}

    assert convert_post_data_to_input(MultiChoiceForm, qdict({"field": ["CHOICE_A"]})) == {
        "field": ["CHOICE_A"]
    }

    assert convert_post_data_to_input(
        MultiChoiceForm, qdict({"field": ["CHOICE_A", "CHOICE_B"]})
    ) == {"field": ["CHOICE_A", "CHOICE_B"]}


def test_convert_post_data_to_input_works_with_bool_fields():
    class BoolForm(forms.Form):
        bool_field = forms.BooleanField()

    assert convert_post_data_to_input(BoolForm, qdict()) == {"boolField": False}
    assert convert_post_data_to_input(BoolForm, qdict({"boolField": ["on"]})) == {"boolField": True}


class FormWithWeirdlyNamedFields(forms.Form):
    # A form with fields that have weird field names that used to trip up
    # our previous implementation. For more details, see:
    #
    # https://github.com/JustFixNYC/tenants2/issues/165

    field_1 = forms.IntegerField()

    field2 = forms.IntegerField()

    bool_field = forms.BooleanField()


FormsetWithWeirdlyNamedFields = forms.formset_factory(FormWithWeirdlyNamedFields, can_delete=True)


class TestConvertPostDataToFormData:
    def setup(self):
        self.form = FormWithWeirdlyNamedFields()

    def convert(self, qdict):
        return convert_post_data_to_form_data(self.form, qdict)

    def test_it_ignores_nonexistent_fields(self):
        assert (
            self.convert(
                qdict(
                    {
                        "blarg": ["5"],
                        "narg": ["6"],
                    }
                )
            )
            == {}
        )

    def test_it_works_with_required_fields(self):
        assert (
            self.convert(
                qdict(
                    {
                        "field1": ["5"],
                        "field2": ["6"],
                    }
                )
            )
            == {"field_1": ["5"], "field2": ["6"]}
        )

    def test_it_works_with_optional_fields(self):
        assert (
            self.convert(
                qdict(
                    {
                        "boolField": ["on"],
                    }
                )
            )
            == {"bool_field": ["on"]}
        )


class TestConvertPostDataToFormsetData:
    def setup(self):
        self.formset = FormsetWithWeirdlyNamedFields()

    def convert(self, qdict):
        return convert_post_data_to_formset_data("foo_1", self.formset, qdict)

    def test_it_ignores_nonexistent_fields(self):
        assert self.convert(qdict({"blah": ["5"]})) == {}

    def test_it_works_with_special_fields(self):
        assert self.convert(
            qdict(
                {
                    "foo1-TOTAL_FORMS": ["1"],
                    "foo1-INITIAL_FORMS": ["1"],
                    "foo1-0-DELETE": ["on"],
                }
            )
        ) == {
            "foo_1-TOTAL_FORMS": ["1"],
            "foo_1-INITIAL_FORMS": ["1"],
            "foo_1-0-DELETE": ["on"],
        }

    def test_it_works_with_required_fields(self):
        assert self.convert(
            qdict(
                {
                    "foo1-TOTAL_FORMS": ["1"],
                    "foo1-0-field1": ["5"],
                    "foo1-0-field2": ["6"],
                }
            )
        ) == {
            "foo_1-TOTAL_FORMS": ["1"],
            "foo_1-0-field_1": ["5"],
            "foo_1-0-field2": ["6"],
        }

    def test_it_works_with_optional_fields(self):
        assert self.convert(qdict({"foo1-TOTAL_FORMS": ["1"], "foo1-0-boolField": ["on"],})) == {
            "foo_1-TOTAL_FORMS": ["1"],
            "foo_1-0-bool_field": ["on"],
        }


def test_muliple_choice_fields_accept_lists():
    result = execute_query(multi_field=["A", "B"])
    assert result["data"]["foo"]["errors"] == []

    result = execute_query(multi_field=["A", "b"])
    assert result["data"]["foo"]["errors"] == [
        {
            "field": "multiField",
            "messages": ["Select a valid choice. b is not one of the available choices."],
        }
    ]


def test_login_required_forms_fail_when_unauthenticated():
    assert execute_form_with_auth_query(user=None) == {
        "data": {
            "formWithAuth": {
                "errors": [
                    {
                        "field": "__all__",
                        "messages": ["You do not have permission to use this form!"],
                    }
                ]
            }
        }
    }


def test_login_required_forms_succeed_when_authenticated():
    assert execute_form_with_auth_query(user=UserFactory.build()) == {
        "data": {"formWithAuth": {"errors": []}}
    }


def test_valid_forms_return_data():
    assert execute_query(bar_field="HI") == {"data": {"foo": {"bazField": "HI back", "errors": []}}}


def test_invalid_forms_return_camelcased_errors():
    assert execute_query(bar_field="") == {
        "data": {
            "foo": {
                "bazField": None,
                "errors": [{"field": "barField", "messages": ["This field is required."]}],
            }
        }
    }


def test_invalid_forms_return_extended_errors():
    assert execute_query(bar_field="", errors="field, extendedMessages { code, message }")["data"][
        "foo"
    ]["errors"] == [
        {
            "field": "barField",
            "extendedMessages": [{"message": "This field is required.", "code": "required"}],
        }
    ]


def test_invalid_forms_return_extended_errors_when_code_is_none():
    assert execute_query(
        bar_field="ERR_WITHOUT_CODE", errors="field, extendedMessages { code, message }"
    )["data"]["foo"]["errors"] == [
        {"field": "__all__", "extendedMessages": [{"message": "error without code", "code": None}]}
    ]


def test_make_error_returns_extended_errors():
    assert execute_query(
        bar_field="MAKE_ERROR", errors="field, extendedMessages { code, message }"
    )["data"]["foo"]["errors"] == [
        {
            "field": "__all__",
            "extendedMessages": [
                {"message": "This error was created by make_error().", "code": "make_error"}
            ],
        }
    ]


def test_get_input_type_from_query_works():
    # Ensure non-nullable input works.
    assert (
        get_input_type_from_query("mutation Foo($input: BarInput!) { foo(input: $input) }")
        == "BarInput"
    )

    # Ensure nullable input works.
    assert (
        get_input_type_from_query("mutation Foo($input: BarInput) { foo(input: $input) }")
        == "BarInput"
    )

    # Ensure syntax errors return None.
    assert get_input_type_from_query("LOL") is None

    # Ensure queries w/o variable definitons work.
    assert get_input_type_from_query("query { blah }") is None

    # Ensure the variable definition must be for "input".
    assert get_input_type_from_query("mutation Foo($boop: BarInput!) { foo(input: $boop) }") is None
