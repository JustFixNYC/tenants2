import logging
from typing import Dict, Any, Optional
from graphql import ResolveInfo
import graphene
from graphene.types.objecttype import ObjectTypeOptions
from graphene_django.forms.mutation import fields_for_form
from graphene.types.utils import yank_fields_from_attrs
from graphene.types.field import Field
from django.http import HttpRequest

from project.util.session_mutation import SessionFormMutation
from project.util.django_graphql_forms import DjangoFormMutationOptions


logger = logging.getLogger(__name__)


class SessionObjectTypeOptions(ObjectTypeOptions):
    form_class = None
    session_key: str = ""


class DjangoSessionFormObjectType(graphene.ObjectType):
    """
    An abstract class for defining a GraphQL object type based on the
    fields of a Django Form, along with a GraphQL resolver for retrieving them
    from a request session.

    The inner Meta class must define a `form_class` that points to a Django Form
    class, and a `session_key` that specifies the request session key the object's
    data can be retrieved from.

    If a Django form's cleaned data includes keys that don't correspond to form
    fields, the form can describe these keys via an 'extra_graphql_output_fields'
    dict attribute that maps the keys to GraphQL scalars.
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls, form_class=None, session_key="", exclude=(), _meta=None, **options
    ):
        if not _meta:
            _meta = SessionObjectTypeOptions(cls)

        assert session_key, f"{cls.__name__} must define Meta.session_key."
        _meta.session_key = session_key

        assert form_class is not None, f"{cls.__name__} must define Meta.form_class."
        _meta.form_class = form_class
        form = form_class()

        fields = yank_fields_from_attrs(fields_for_form(form, [], exclude), _as=Field)
        if hasattr(form, "extra_graphql_output_fields"):
            fields.update(yank_fields_from_attrs(form.extra_graphql_output_fields, _as=Field))

        if _meta.fields:
            _meta.fields.update(fields)
        else:
            _meta.fields = fields

        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def migrate_dict(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        """
        Subclasses can override this if they want to implement custom logic that
        migrates the dict stored by an old version of the backend to the latest
        schema needed by the current backend.
        """

        return value

    @classmethod
    def get_dict_from_request(cls, request: HttpRequest) -> Optional[Dict[str, Any]]:
        """
        If the object data exists in the given request's session, return it.
        """

        value = request.session.get(cls._meta.session_key)
        if value is None:
            return None
        return cls.migrate_dict(value)

    @classmethod
    def clear_from_request(cls, request: HttpRequest):
        """
        If the object data exists in the given request's session, remove it.
        """

        if cls._meta.session_key in request.session:
            request.session.pop(cls._meta.session_key)

    @classmethod
    def _resolve_from_session(cls, parent, info: ResolveInfo):
        key = cls._meta.session_key
        request = info.context
        obinfo = request.session.get(key)
        if obinfo:
            try:
                return cls(**cls.migrate_dict(obinfo))
            except TypeError:
                # This can happen when we change the "schema" of an onboarding
                # step while a user's session contains data in the old schema.
                #
                # This should technically never happen if we remember to tie
                # the session key name to a version, e.g. "user_v1", but it's possible we
                # might forget to do that.
                logger.exception(f"Error deserializing {key} from session")
                request.session.pop(key)
        return None

    @classmethod
    def field(cls, **kwargs):
        """
        Return a GraphQL Field associated with this type, with a resolver
        that retrieves the object of this type from the request session, if
        it exists.
        """

        return graphene.Field(cls, resolver=cls._resolve_from_session, **kwargs)


class StoreToSessionFormOptions(DjangoFormMutationOptions):
    session_key: str = ""


class DjangoSessionFormMutation(SessionFormMutation):
    """
    Abstract base class that just stores the form's cleaned data to
    the current request's session.

    Concrete subclasses must define a Meta.source property that
    points to a concrete DjangoSessionFormObjectType subclass.
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(cls, source=None, _meta=None, **options):
        if not _meta:
            _meta = StoreToSessionFormOptions(cls)

        assert issubclass(
            source, DjangoSessionFormObjectType
        ), f"{cls.__name__} must define Meta.source."

        _meta.session_key = source._meta.session_key
        options["form_class"] = source._meta.form_class

        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        request.session[cls._meta.session_key] = form.cleaned_data
        return cls.mutation_success()
