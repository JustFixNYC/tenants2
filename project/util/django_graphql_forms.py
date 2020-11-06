'''
    This builds upon/replaces Graphene-Django's default form integration
    to resolve some of its limitations.
'''

from typing import (
    Optional, Type, Dict, Any, TypeVar, MutableMapping, List, Iterable)
from collections import OrderedDict
from weakref import WeakValueDictionary
from django import forms
from django.forms import formsets
from django.http import QueryDict
from django.core.exceptions import ValidationError
from django.forms.models import InlineForeignKeyField
from graphql import ResolveInfo, parse, visit
from graphql.language.visitor import Visitor
from graphql.language.ast import NamedType, VariableDefinition
from graphql.error import GraphQLSyntaxError
import graphene
from graphene.types import ObjectType, Argument, InputObjectType, Field
from graphene.types.objecttype import ObjectTypeOptions
from graphene.relay.mutation import ClientIDMutation
from graphene.types.utils import yank_fields_from_attrs
from graphene.types.mutation import MutationOptions
from graphene_django.forms.converter import convert_form_field
from graphene_django.forms.mutation import fields_for_form
from graphene.utils.str_converters import to_camel_case
import logging


SPECIAL_FORMSET_FIELD_NAMES = [
    formsets.TOTAL_FORM_COUNT,
    formsets.INITIAL_FORM_COUNT,
    formsets.MIN_NUM_FORM_COUNT,
    formsets.MAX_NUM_FORM_COUNT,
]

logger = logging.getLogger(__name__)

FormsetClasses = Dict[str, Type[forms.BaseFormSet]]

Formsets = Dict[str, forms.BaseFormSet]


@convert_form_field.register(InlineForeignKeyField)
def convert_inline_foreign_key_field(field):
    return graphene.ID()


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
@convert_form_field.register(forms.DecimalField)
@convert_form_field.register(forms.IntegerField)
@convert_form_field.register(forms.EmailField)
def convert_form_field_to_required_string(field):
    # Note that we're *always* setting required to True, even if the
    # field isn't required. This is because we always want an empty
    # string to be passed-in if the field is empty, rather than null.
    return graphene.String(description=field.help_text, required=True)


@convert_form_field.register(forms.BooleanField)
def convert_form_field_to_required_boolean(field):
    # We always want our booleans to be required; this actually
    # used to be the default behavior of graphene-django, but it was
    # changed byhttps://github.com/graphql-python/graphene-django/pull/613.
    return graphene.Boolean(description=field.help_text, required=True)


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


def _set_list_if_nonempty(data: QueryDict, key: str, value: List[Any]):
    if value:
        data.setlist(key, value)


def convert_post_data_to_form_data(
    form: forms.Form,
    data: QueryDict,
) -> QueryDict:
    '''
    Convert CamelCased POST data for the given form into snake_cased POST data.

    Ideally we could do this via pure string manipulation, but there are
    issues with that, such as e.g. the fact that `foo_1` and `foo1` both map
    to `foo1` when converted to CamelCase, which means they can't reliably be
    converted back to snake_case.
    '''

    snake_cased_data = QueryDict(mutable=True)
    for snake_key in form.fields:
        value = data.getlist(to_camel_case(snake_key))
        _set_list_if_nonempty(snake_cased_data, snake_key, value)
    return snake_cased_data


def convert_post_data_to_formset_data(
    snake_formset_name: str,
    formset: forms.BaseFormSet,
    data: QueryDict
) -> QueryDict:
    '''
    Convert CamelCased POST data for the given formsets into snake_cased POST data.
    '''

    snake_cased_data = QueryDict(mutable=True)
    camel_formset_name = to_camel_case(snake_formset_name)
    total_forms_key = f'{camel_formset_name}-{formsets.TOTAL_FORM_COUNT}'
    total_forms = _get_safe_int(
        data.get(total_forms_key, ''), default=0, max_value=formsets.DEFAULT_MAX_NUM)
    for special_key in SPECIAL_FORMSET_FIELD_NAMES:
        snake_key = f'{snake_formset_name}-{special_key}'
        camel_key = f'{camel_formset_name}-{special_key}'
        value = data.getlist(camel_key)
        _set_list_if_nonempty(snake_cased_data, snake_key, value)
    form = get_formset_form(formset)
    for i in range(total_forms):
        for snake_field_name in form.fields:
            snake_key = f'{snake_formset_name}-{i}-{snake_field_name}'
            camel_key = f'{camel_formset_name}-{i}-{to_camel_case(snake_field_name)}'
            value = data.getlist(camel_key)
            _set_list_if_nonempty(snake_cased_data, snake_key, value)
    return snake_cased_data


def convert_post_data_to_input(
    form_class: Type[forms.Form],
    data: QueryDict,
    formset_classes: Optional[FormsetClasses] = None,
    exclude_fields: Iterable[str] = tuple()
) -> Dict[str, Any]:
    '''
    Given a QueryDict that represents POST data, return a dictionary
    suitable for passing to a GraphQL mutation that is derived from
    the given form and formset classes.
    '''

    snake_cased_data = convert_post_data_to_form_data(form_class(), data)
    form = form_class(data=snake_cased_data)
    result = _get_camel_cased_field_data(form, exclude_fields)
    if formset_classes:
        result.update(_convert_formset_post_data_to_input(
            data, formset_classes, exclude_fields))
    return result


def _fielddata(form: forms.Form, field: str) -> Any:
    field_obj = form[field].field
    data = form[field].data
    if isinstance(field_obj, forms.ChoiceField) and data is None:
        # If the field is a required radio field, the GraphQL schema will be expecting
        # a string, not null, so let's convert the field's value to an empty string.
        data = ''
    return data


def _get_safe_int(value: str, default: int, max_value: int) -> int:
    try:
        return min([int(value), max_value])
    except ValueError:
        return default


def get_formset_form(formset: forms.BaseFormSet) -> forms.Form:
    # This seems to be the easiest way to get a form instance behind
    # a formset while including any additional fields like DELETE.
    #
    # We should be careful though, because if a formset doesn't actually
    # have any initial forms (e.g. because users can delete from it but
    # not add to it), this could throw.
    return formset.forms[0]


def _convert_formset_post_data_to_input(
    data: QueryDict,
    formset_classes: FormsetClasses,
    exclude_fields: Iterable[str]
) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    for (snake_formset_name, formset_class) in (formset_classes or {}).items():
        snake_cased_data = convert_post_data_to_formset_data(
            snake_formset_name,
            formset_class(),
            data
        )
        formset = formset_class(data=snake_cased_data, prefix=snake_formset_name)
        result[to_camel_case(snake_formset_name)] = _get_formset_items(formset, exclude_fields)
    return result


def _get_camel_cased_field_data(form, exclude_fields: Iterable[str]):
    return {
        to_camel_case(field):
            _fielddata(form, field) for field in form.fields if field not in exclude_fields
    }


def _get_formset_items(formset, exclude_fields: Iterable[str]) -> List[Any]:
    items: List[Any] = []
    for form in formset.forms:
        item = _get_camel_cased_field_data(form, exclude_fields)

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
    def list_from_error_list(cls, errors: forms.utils.ErrorList):
        results = []
        for error in errors.get_json_data():
            message = error['message']
            code = None if not error['code'] else str(error['code'])
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
    def list_from_form_errors(cls, form_errors: forms.utils.ErrorDict):
        errors = []
        for key, value in form_errors.items():
            extended = ExtendedFormFieldError.list_from_error_list(value)
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
        self.base_form.full_clean()

        errors = forms.utils.ErrorDict()
        errors.update(self.base_form.errors)
        self._errors = errors

        for name in self.get_formset_names_to_clean():
            self._full_clean_formset(name)

    def get_formset_names_to_clean(self) -> List[str]:
        return [name for name in self.formsets]

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
            all_errors = self._errors.get('__all__', forms.utils.ErrorList())
            all_errors.extend(non_form_errors)
            self.errors['__all__'] = all_errors

        for i in range(len(formset.errors)):
            for key, value in formset.errors[i].items():
                self._errors[f'{name}.{i}.{key}'] = value

    def is_valid(self) -> bool:
        return not self.errors


class DjangoFormOptionsMixin:
    '''
    Attributes common to any Meta class in a GraphQL query
    that uses Django forms for validation.
    '''

    form_class: Optional[Type[forms.Form]] = None  # noqa (flake8 bug)

    formset_classes: Optional[FormsetClasses] = None  # noqa (flake8 bug)

    exclude_fields: Optional[Iterable[str]] = None


class GrapheneDjangoFormMixin:
    '''
    This mixin class for Graphene's ObjectType can be used to add
    plumbing common to a GraphQL query that uses at least one
    Django form for validation.

    This class is needed because Graphene uses different classes
    for GraphQL queries and mutations, and we want to use Django
    forms for validating both (this is analogous to using Django
    forms for both GET and POST requests).
    '''

    query_type: str = "[Subclasses should define this!]"

    _input_type_to_mut_mapping: MutableMapping[str, Type['DjangoFormMutation']] = \
        WeakValueDictionary()

    _input_type_registry: MutableMapping[Any, Type[InputObjectType]] = WeakValueDictionary()

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
    def populate_meta_options_and_get_input_fields(
        cls,
        _meta: DjangoFormOptionsMixin,
        form_class: Type[forms.Form],
        formset_classes: Optional[FormsetClasses] = None,
        only_fields=(), exclude_fields=()
    ):
        form = form_class()
        input_fields = fields_for_form(form, only_fields, exclude_fields)

        formset_classes = formset_classes or {}

        for (formset_name, formset_class) in formset_classes.items():
            formset_form = get_formset_form(formset_class())
            formset_input_fields = fields_for_form(formset_form, only_fields, exclude_fields)
            type_key = (formset_form.__class__, tuple(only_fields), tuple(exclude_fields))
            formset_form_type = cls._register_input_type(type_key, type(
                f"{to_capitalized_camel_case(formset_name)}{formset_class.__name__}Input",
                (graphene.InputObjectType,),
                yank_fields_from_attrs(formset_input_fields, _as=graphene.InputField)
            ))
            if formset_name in input_fields:
                raise AssertionError(f'multiple definitions for "{formset_name}" exist')
            input_field_for_form = yank_fields_from_attrs({
                formset_name: graphene.List(
                    graphene.NonNull(formset_form_type),
                    required=True
                )
            })
            input_fields.update(input_field_for_form)

        _meta.form_class = form_class
        _meta.formset_classes = formset_classes
        _meta.exclude_fields = exclude_fields

        input_fields = yank_fields_from_attrs(input_fields, _as=graphene.InputField)

        return input_fields

    @classmethod
    def _register_input_type(
        cls,
        key: Any,
        input_type: Type[InputObjectType]
    ) -> Type[InputObjectType]:
        if key not in cls._input_type_registry:
            cls._input_type_registry[key] = input_type
        return cls._input_type_registry[key]

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
    def get_exclude_fields_for_input_type(cls, input_type: str) -> Iterable[str]:
        mut_class = cls._input_type_to_mut_mapping.get(input_type)
        if not mut_class:
            return []
        return mut_class._meta.exclude_fields or []

    @classmethod
    def get_form(cls, root, info, **input):
        form_kwargs = cls.get_form_kwargs(root, info, **input)
        form = cls._meta.form_class(**form_kwargs)  # type: ignore
        if not cls._meta.formset_classes:  # type: ignore
            return form
        return cls.get_form_with_formsets(form, cls._get_formsets(root, info, **input))

    @classmethod
    def get_form_with_formsets(cls, form: forms.Form, formsets: Formsets) -> FormWithFormsets:
        return FormWithFormsets(form, formsets)

    @classmethod
    def _get_formsets(cls: ObjectType, root, info, **input) -> Formsets:
        formsets: Formsets = {}  # noqa (flake8 bug)
        for (formset_name, formset_class) in cls._meta.formset_classes.items():
            formset_kwargs = cls.get_formset_kwargs(
                root, info, formset_name, input[formset_name], input)
            formsets[formset_name] = formset_class(**formset_kwargs)
        return formsets

    @classmethod
    def get_data_for_formset(cls, fsinput, initial_forms=None) -> Dict[str, Any]:
        data: Dict[str, Any] = {}
        data['form-TOTAL_FORMS'] = len(fsinput)
        data['form-INITIAL_FORMS'] = len(fsinput) if initial_forms is None else initial_forms
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
    def get_formset_kwargs(cls, root, info, formset_name, input, all_input):
        kwargs = {"data": cls.get_data_for_formset(input)}
        return kwargs

    @classmethod
    def perform_resolve(cls, root, info: ResolveInfo, resolver, **input):
        request = info.context

        if cls.login_required and not request.user.is_authenticated:
            cls.log(info, f"User must be logged in to access {cls.query_type}.")
            return cls.make_error('You do not have permission to use this form!')

        form = cls.get_form(root, info, **input)

        if form.is_valid():
            cls.log(info, f"Form is valid, performing {cls.query_type}.")
            return resolver(form, info)
        else:
            errors = StrictFormFieldErrorType.list_from_form_errors(form.errors)
            cls.log(info, f"Form is invalid with {len(errors)} error(s).")
            return cls(errors=errors)  # type: ignore

    @classmethod
    def log(cls, info: ResolveInfo, msg: str, lvl: int = logging.INFO) -> None:
        parts = [f'{info.field_name} {cls.query_type}']
        user = info.context.user
        if user.is_authenticated:
            parts.append(f'user={user.username}')
        preamble = ' '.join(parts)
        logger.log(lvl, f"[{preamble}] {msg}")

    @classmethod
    def make_and_log_error(cls, info: ResolveInfo, message: str, code: Optional[str] = None):
        cls.log(info, f"Returning form error '{message}'.", lvl=logging.ERROR)
        return cls.make_error(message, code)

    @classmethod
    def make_error(cls, message: str, code: Optional[str] = None):
        errors = StrictFormFieldErrorType.list_from_form_errors(
            forms.utils.ErrorDict({
                '__all__': forms.utils.ErrorList([
                    ValidationError(message, code=code)
                ])
            })
        )
        return cls(errors=errors)  # type: ignore


class DjangoFormQueryOptions(DjangoFormOptionsMixin, ObjectTypeOptions):
    '''
    Attributes in the Meta class for DjangoFormQuery.
    '''

    arguments: Optional[Dict[str, Argument]] = None


class DjangoFormQuery(GrapheneDjangoFormMixin, ObjectType):
    '''
    This can be used for making any GraphQL query (not a
    mutation) use at least one Django form for validation. It
    is the GraphQL analog to using Django forms for a
    GET request.
    '''

    class Meta:
        abstract = True

    query_type = "query"

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        form_class: Type[forms.Form] = forms.Form,
        formset_classes: Optional[FormsetClasses] = None,
        only_fields=(), exclude_fields=(), **options
    ):
        _meta = DjangoFormQueryOptions(cls)
        input_fields = cls.populate_meta_options_and_get_input_fields(
            _meta=_meta,
            form_class=form_class,
            formset_classes=formset_classes,
            only_fields=only_fields,
            exclude_fields=exclude_fields,
        )

        cls.Input = type(
            "{}Input".format(cls.__name__),
            (InputObjectType,),
            OrderedDict(input_fields)
        )
        _meta.arguments = OrderedDict(input=cls.Input(required=True))

        super().__init_subclass_with_meta__(_meta=_meta, **options)

        cls._input_type_to_mut_mapping[cls.Input.__name__] = cls

    @classmethod
    def perform_query(cls, form, info):
        # This should be implemented by subclasses.
        return cls(errors=[])

    @classmethod
    def query_and_get_payload(cls, root, info: ResolveInfo, input):
        return cls.perform_resolve(root, info, cls.perform_query, **input)

    @classmethod
    def Field(
        cls, name=None, description=None, deprecation_reason=None, required=False
    ):
        return Field(
            cls,
            args=cls._meta.arguments,
            resolver=cls.query_and_get_payload,
            name=name,
            description=description,
            deprecation_reason=deprecation_reason,
            required=required,
        )


class DjangoFormMutationOptions(DjangoFormOptionsMixin, MutationOptions):
    '''
    Attributes in the Meta class for DjangoFormMutation.
    '''

    pass


class DjangoFormMutation(GrapheneDjangoFormMixin, ClientIDMutation):
    '''
    This can be used for making any GraphQL mutation use at least
    one Django form for validation. It is the GraphQL analog to
    using Django forms for a POST request.

    This is similar to Graphene-Django's eponymous class, but makes enough
    changes to its behavior that it's easier to just derive the class
    from Graphene's ClientIDMutation rather than subclass Graphene-Django's
    class and make pervasive modifications.
    '''

    class Meta:
        abstract = True

    query_type = "mutation"

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        _meta=None,
        form_class: Type[forms.Form] = forms.Form,
        formset_classes: Optional[FormsetClasses] = None,
        only_fields=(), exclude_fields=(), **options
    ):
        if not _meta:
            _meta = DjangoFormMutationOptions(cls)

        input_fields = cls.populate_meta_options_and_get_input_fields(
            _meta=_meta,
            form_class=form_class,
            formset_classes=formset_classes,
            only_fields=only_fields,
            exclude_fields=exclude_fields,
        )

        super().__init_subclass_with_meta__(
            _meta=_meta, input_fields=input_fields, **options
        )

        cls._input_type_to_mut_mapping[cls.Input.__name__] = cls

    @classmethod
    def mutate_and_get_payload(cls: Type[T], root, info: ResolveInfo, **input) -> T:
        return cls.perform_resolve(root, info, cls.perform_mutate, **input)

    @classmethod
    def perform_mutate(cls, form, info):
        # This should be implemented by subclasses.
        return cls(errors=[])


get_form_class_for_input_type = GrapheneDjangoFormMixin.get_form_class_for_input_type
get_formset_classes_for_input_type = GrapheneDjangoFormMixin.get_formset_classes_for_input_type
get_exclude_fields_for_input_type = GrapheneDjangoFormMixin.get_exclude_fields_for_input_type
