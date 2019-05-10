'''
    This builds upon/replaces Graphene-Django's default form integration
    to resolve some of its limitations.
'''

from typing import Optional, Type, Dict, Any, TypeVar, MutableMapping, List
from weakref import WeakValueDictionary
from django import forms
from django.http import QueryDict
from django.core.exceptions import ValidationError
from graphql import ResolveInfo, parse, visit
from graphql.language.visitor import Visitor
from graphql.language.ast import NamedType, VariableDefinition
from graphql.error import GraphQLSyntaxError
import graphene
from graphene.relay.mutation import ClientIDMutation
from graphene.types.utils import yank_fields_from_attrs
from graphene.types.mutation import MutationOptions
from graphene_django.forms.converter import convert_form_field
from graphene_django.forms.mutation import fields_for_form
from graphene.utils.str_converters import to_camel_case, to_snake_case
import logging


logger = logging.getLogger(__name__)

FormsetClasses = Dict[str, Type[forms.BaseFormSet]]

Formsets = Dict[str, forms.BaseFormSet]


# Graphene-Django doesn't suport MultipleChoiceFields out-of-the-box, so we'll
# add support for it.
@convert_form_field.register(forms.MultipleChoiceField)
def convert_form_field_to_required_list(field):
    # Note that we're *always* setting required to True, even if the
    # field isn't required. This is because we always want an empty
    # list to be passed-in if the field is empty, rather than null.
    return graphene.List(graphene.NonNull(graphene.String), required=True)


@convert_form_field.register(forms.CharField)
@convert_form_field.register(forms.DateField)
@convert_form_field.register(forms.ChoiceField)
def convert_form_field_to_required_string(field):
    # Note that we're *always* setting required to True, even if the
    # field isn't required. This is because we always want an empty
    # string to be passed-in if the field is empty, rather than null.
    return graphene.String(description=field.help_text, required=True)


def get_input_type_from_query(query: str) -> Optional[str]:
    '''
    Given a GraphQL query for a DjangoFormMutation, return the input type, e.g.:

        >>> get_input_type_from_query(
        ...     'mutation FooMutation($input: BarInput!) { foo(input: $input) }')
        'BarInput'

    If the input type cannot be found, return None.
    '''

    try:
        ast = parse(query)
    except GraphQLSyntaxError:
        return None

    class InputTypeVisitor(Visitor):
        in_input_definition: bool = False
        input_type: Optional[str] = None

        def enter(self, node, *args):
            if isinstance(node, VariableDefinition) and node.variable.name.value == 'input':
                self.in_input_definition = True
            elif isinstance(node, NamedType) and self.in_input_definition:
                self.input_type = node.name.value

        def leave(self, node, *args):
            if isinstance(node, VariableDefinition) and node.variable.name.value == 'input':
                self.in_input_definition = False

    visitor = InputTypeVisitor()
    visit(ast, visitor)

    return visitor.input_type


def to_capitalized_camel_case(s: str) -> str:
    '''
    Like `to_camel_case()`, but also capitalizes the first letter:

        >>> to_capitalized_camel_case('hello_there')
        'HelloThere'
    '''

    camel = to_camel_case(s)
    return camel[:1].upper() + camel[1:]


def convert_post_data_to_input(
    form_class: Type[forms.Form],
    data: QueryDict,
    formset_classes: Optional[FormsetClasses] = None
) -> Dict[str, Any]:
    '''
    Given a QueryDict that represents POST data, return a dictionary
    suitable for passing to a GraphQL mutation that is derived from
    the given form and formset classes.
    '''

    snake_cased_data = QueryDict(mutable=True)
    for key in data:
        snake_key = to_snake_case(key)
        # Urg, to_snake_case() mangles formset management names,
        # so we need to un-mangle them.
        snake_key = snake_key\
            .replace('-total_forms', '-TOTAL_FORMS')\
            .replace('-initial_forms', '-INITIAL_FORMS')
        snake_cased_data.setlist(snake_key, data.getlist(key))
    form = form_class(data=snake_cased_data)
    result = {
        to_camel_case(field): _fielddata(form, field) for field in form.fields
    }
    if formset_classes:
        result.update(_convert_formset_post_data_to_input(
            snake_cased_data, formset_classes))
    return result


def _fielddata(form: forms.Form, field: str) -> Any:
    field_obj = form[field].field
    data = form[field].data
    if isinstance(field_obj, forms.ChoiceField) and data is None:
        # If the field is a required radio field, the GraphQL schema will be expecting
        # a string, not null, so let's convert the field's value to an empty string.
        data = ''
    return data


def _convert_formset_post_data_to_input(
    snake_cased_data: QueryDict,
    formset_classes: FormsetClasses
) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    for (formset_name, formset_class) in (formset_classes or {}).items():
        formset = formset_class(data=snake_cased_data, prefix=formset_name)
        result[to_camel_case(formset_name)] = _get_formset_items(formset)
    return result


def _get_formset_items(formset) -> List[Any]:
    items: List[Any] = []
    for form in formset.forms:
        item = {
            to_camel_case(field): _fielddata(form, field) for field in form.fields
        }

        # Note that form.empty_permitted has been set based on
        # the formset management data, so we're essentially testing
        # to see if the form is empty *and* if it's okay for the form
        # to be empty here. This check is basically taken from
        # Form.full_clean().
        is_form_empty = form.empty_permitted and not form.has_changed()

        if not is_form_empty:
            items.append(item)
    return items


class ExtendedFormFieldError(graphene.ObjectType):
    '''
    Contains extended information about a form field error, including
    not only its human-readable message, but also additional details,
    such as its error code.
    '''

    message = graphene.String(
        required=True,
        description="A human-readable validation error."
    )

    code = graphene.String(
        description="A machine-readable representation of the error."
    )

    @classmethod
    def list_from_validation_errors(cls, errors: List[ValidationError]):
        results = []
        for error in errors:
            message = error.message
            code = None if error.code is None else str(error.code)
            results.append(cls(message=message, code=code))
        return results


class StrictFormFieldErrorType(graphene.ObjectType):
    '''
    This is similar to Graphene-Django's default form field
    error type, but with all fields required, to simplify
    the type system.
    '''

    field = graphene.String(
        required=True,
        description=(
            "The camel-cased name of the input field, or "
            "'__all__' for non-field errors."
        )
    )

    messages = graphene.List(
        graphene.NonNull(graphene.String),
        required=True,
        description="A list of human-readable validation errors."
    )

    extended_messages = graphene.List(
        graphene.NonNull(ExtendedFormFieldError),
        required=True,
        description="A list of validation errors with extended metadata."
    )

    @classmethod
    def list_from_form_errors(cls, form_errors):
        errors = []
        errors_as_data = form_errors.as_data()
        for key, value in form_errors.items():
            extended = ExtendedFormFieldError.list_from_validation_errors(
                errors_as_data.get(key, []))
            if not key.endswith('__all__'):
                # Graphene-Django's default implementation for form field validation
                # errors doesn't convert field names to camel case, but we want to,
                # because the input was provided using camel case field names, so the
                # errors should use them too.
                key = to_camel_case(key)
            errors.append(cls(field=key, messages=value, extended_messages=extended))
        return errors


T = TypeVar('T', bound='DjangoFormMutation')


class FormWithFormsets:
    '''
    Represents a base form with additional formsets, all of which are bound.
    '''

    def __init__(self, base_form: forms.Form, formsets: Formsets) -> None:
        self.base_form = base_form
        self.formsets = formsets
        self._errors: Optional[Dict[str, List[str]]] = None

    @property
    def errors(self):
        if self._errors is None:
            self.full_clean()
        return self._errors

    def full_clean(self):
        self._errors = forms.utils.ErrorDict()
        self.base_form.full_clean()
        self._errors.update(self.base_form.errors)
        for name in self.formsets:
            self._full_clean_formset(name)

    def _full_clean_formset(self, name: str):
        assert self._errors is not None
        formset = self.formsets[name]
        formset.full_clean()

        # We'll have non-form errors "masquerade" as
        # non-field errors for our base form.
        #
        # This isn't an ideal way to report non-form errors in
        # formsets, especially since the error text confusingly
        # refers to the word "forms", but it's better than
        # not reporting them at all, and we can improve
        # on it later.
        non_form_errors = formset.non_form_errors()
        if non_form_errors:
            all_errors = self._errors.get('__all__', [])
            all_errors.extend(non_form_errors)
            self.errors['__all__'] = all_errors

        for i in range(len(formset.errors)):
            for key, value in formset.errors[i].items():
                self._errors[f'{name}.{i}.{key}'] = value

    def is_valid(self) -> bool:
        return not self.errors


class DjangoFormMutationOptions(MutationOptions):
    form_class: Optional[Type[forms.Form]] = None  # noqa (flake8 bug)

    formset_classes: Optional[FormsetClasses] = None  # noqa (flake8 bug)


class DjangoFormMutation(ClientIDMutation):
    '''
    This is similar to Graphene-Django's eponymous class, but makes enough
    changes to its behavior that it's easier to just derive the class
    from Graphene's ClientIDMutation rather than subclass Graphene-Django's
    class and make pervasive modifications.
    '''

    class Meta:
        abstract = True

    _input_type_to_mut_mapping: MutableMapping[str, Type['DjangoFormMutation']] = \
        WeakValueDictionary()

    # Subclasses can change this if they can only be used by authenticated users.
    #
    # Note that we'd ideally like this to be a Meta property, but we also want
    # to be able to define abstract base classes that set this property to True,
    # but doing so raises the error "Abstract types can only contain the abstract
    # attribute". So we'll just make it a class attribute.
    login_required = False

    # This is just like Graphene-Django's DjangoFormMutation "errors"
    # attribute, only it's required, to simplify the type system.
    errors = graphene.List(
        graphene.NonNull(StrictFormFieldErrorType),
        default_value=[],
        required=True,
        description=(
            "A list of validation errors in the form, if any. "
            "If the form was valid, this list will be empty."
        )
    )

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        form_class: Type[forms.Form] = forms.Form,
        formset_classes: Optional[FormsetClasses] = None,
        only_fields=(), exclude_fields=(), **options
    ):
        form = form_class()
        input_fields = fields_for_form(form, only_fields, exclude_fields)

        formset_classes = formset_classes or {}

        for (formset_name, formset_class) in formset_classes.items():
            formset_form = formset_class.form()
            formset_input_fields = fields_for_form(formset_form, (), ())
            formset_form_type = type(
                f"{to_capitalized_camel_case(formset_name)}{formset_class.__name__}Input",
                (graphene.InputObjectType,),
                yank_fields_from_attrs(formset_input_fields, _as=graphene.InputField)
            )
            if formset_name in input_fields:
                raise AssertionError(f'multiple definitions for "{formset_name}" exist')
            input_field_for_form = yank_fields_from_attrs({
                formset_name: graphene.List(
                    graphene.NonNull(formset_form_type),
                    required=True
                )
            })
            input_fields.update(input_field_for_form)

        # The original Graphene-Django implementation set the output fields
        # to the same value as the input fields. We don't need this, and it
        # bloats our schema, so we'll ignore it.
        output_fields = {}  # type: ignore

        _meta = DjangoFormMutationOptions(cls)
        _meta.form_class = form_class
        _meta.formset_classes = formset_classes
        _meta.fields = yank_fields_from_attrs(output_fields, _as=graphene.Field)

        input_fields = yank_fields_from_attrs(input_fields, _as=graphene.InputField)
        super().__init_subclass_with_meta__(
            _meta=_meta, input_fields=input_fields, **options
        )

        cls._input_type_to_mut_mapping[cls.Input.__name__] = cls

    @classmethod
    def get_form_class_for_input_type(cls, input_type: str) -> Optional[Type[forms.Form]]:
        '''
        Given the name of a GraphQL input type that has been defined by us,
        return the form class it corresponds to.
        '''

        mut_class = cls._input_type_to_mut_mapping.get(input_type)
        if not mut_class:
            return None
        return mut_class._meta.form_class

    @classmethod
    def get_formset_classes_for_input_type(cls, input_type: str) -> Optional[FormsetClasses]:
        mut_class = cls._input_type_to_mut_mapping.get(input_type)
        if not mut_class:
            return None
        return mut_class._meta.formset_classes

    @classmethod
    def log(cls, info: ResolveInfo, msg: str) -> None:
        parts = [f'{info.field_name} mutation']
        user = info.context.user
        if user.is_authenticated:
            parts.append(f'user={user.username}')
        preamble = ' '.join(parts)
        logger.info(f"[{preamble}] {msg}")

    @classmethod
    def make_error(cls: Type[T], message: str) -> T:
        err = StrictFormFieldErrorType(field='__all__', messages=[message])
        return cls(errors=[err])

    @classmethod
    def mutate_and_get_payload(cls: Type[T], root, info: ResolveInfo, **input) -> T:
        request = info.context

        if cls.login_required and not request.user.is_authenticated:
            cls.log(info, "User must be logged in to access mutation.")
            return cls.make_error('You do not have permission to use this form!')

        form = cls.get_form(root, info, **input)

        if form.is_valid():
            cls.log(info, "Form is valid, performing mutation.")
            return cls.perform_mutate(form, info)
        else:
            errors = StrictFormFieldErrorType.list_from_form_errors(form.errors)
            cls.log(info, f"Form is invalid with {len(errors)} error(s).")
            return cls(errors=errors)

    @classmethod
    def get_form(cls, root, info, **input):
        form_kwargs = cls.get_form_kwargs(root, info, **input)
        form = cls._meta.form_class(**form_kwargs)
        if not cls._meta.formset_classes:
            return form
        return FormWithFormsets(form, cls._get_formsets(root, info, **input))

    @classmethod
    def _get_formsets(cls, root, info, **input) -> Formsets:
        formsets: Formsets = {}  # noqa (flake8 bug)
        for (formset_name, formset_class) in cls._meta.formset_classes.items():
            fsinput = input[formset_name]
            formset = formset_class(data=cls._get_data_for_formset(fsinput))
            formsets[formset_name] = formset
        return formsets

    @classmethod
    def _get_data_for_formset(cls, fsinput) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        data['form-TOTAL_FORMS'] = data['form-INITIAL_FORMS'] = len(fsinput)
        for i in range(len(fsinput)):
            for key, value in fsinput[i].items():
                data[f'form-{i}-{key}'] = value
        return data

    @classmethod
    def get_form_kwargs(cls, root, info, **input):
        kwargs = {"data": input}

        # Graphene-Django's implementation of this method contained
        # some logic to retrieve the input's "id" parameter and
        # convert it into an "instance" kwarg for the form, but
        # we don't need it right now.

        return kwargs

    @classmethod
    def perform_mutate(cls, form, info):
        return cls(errors=[])


get_form_class_for_input_type = DjangoFormMutation.get_form_class_for_input_type
get_formset_classes_for_input_type = DjangoFormMutation.get_formset_classes_for_input_type
