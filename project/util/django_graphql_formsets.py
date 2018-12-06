from typing import Dict, Any
from graphene.relay.mutation import ClientIDMutation
from graphene.types.mutation import MutationOptions
from graphene.types.utils import yank_fields_from_attrs
import graphene
from graphene_django.forms.mutation import fields_for_form
from django.forms import formset_factory

from .django_graphql_forms import StrictFormFieldErrorType


ITEMS = 'items'


class FormsetErrorType(graphene.ObjectType):
    non_form_errors = graphene.List(
        graphene.NonNull(graphene.String),
        default_value=[],
        required=True
    )

    form_errors = graphene.List(
        graphene.NonNull(graphene.List(
            graphene.NonNull(StrictFormFieldErrorType),
            required=True,
        )),
        default_value=[],
        required=True
    )

    @classmethod
    def from_formset(cls, formset):
        return cls(
            non_form_errors=formset.non_form_errors(),
            form_errors=[
                StrictFormFieldErrorType.list_from_form_errors(errors)
                for errors in formset.errors
            ]
        )


class DjangoFormsetMutationOptions(MutationOptions):
    form_class = None


class DjangoFormsetMutation(ClientIDMutation):
    class Meta:
        abstract = True

    errors = graphene.NonNull(
        FormsetErrorType,
        default_value=FormsetErrorType()
    )

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        formset_class = formset_factory(cls._meta.form_class)
        prefix = 'form'

        items = input[ITEMS]
        data: Dict[str, Any] = {
            f'{prefix}-TOTAL_FORMS': str(len(items)),
            f'{prefix}-INITIAL_FORMS': '0',
            f'{prefix}-MAX_NUM_FORMS': '',
        }
        for i in range(len(items)):
            item = items[i]
            for name, value in item.items():
                data[f'{prefix}-{i}-{name}'] = value

        formset = formset_class(data=data, prefix=prefix)
        if formset.is_valid():
            return cls.perform_mutate(formset, info)
        else:
            return cls(errors=FormsetErrorType.from_formset(formset))

    @classmethod
    def __init_subclass_with_meta__(
        cls, form_class=None, **options
    ):
        form = form_class()
        only_fields = ()
        exclude_fields = ()
        input_fields = fields_for_form(form, only_fields, exclude_fields)

        _meta = DjangoFormsetMutationOptions(cls)
        _meta.form_class = form_class

        form_type = type(
            f"{cls.__name__}ItemInput",
            (graphene.InputObjectType,),
            yank_fields_from_attrs(input_fields, _as=graphene.InputField)
        )

        input_fields = yank_fields_from_attrs({
            ITEMS: graphene.List(graphene.NonNull(form_type), required=True)
        }, _as=graphene.InputField)

        super().__init_subclass_with_meta__(
            _meta=_meta,
            input_fields=input_fields,
        )

    @classmethod
    def perform_mutate(cls, formset, info):
        raise NotImplementedError()
