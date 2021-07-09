from abc import ABC, abstractmethod
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


class SessionStorage(ABC):
    @abstractmethod
    def load(self, request: HttpRequest) -> Optional[Dict[str, Any]]:
        """
        If the object data exists in the given request's session, return it.
        """

        pass

    @abstractmethod
    def save(cls, request: HttpRequest, data: Dict[str, Any]):
        """
        Save the given object to the given request's session.
        """

        pass

    @abstractmethod
    def clear(self, request: HttpRequest):
        """
        If the object data exists in the given request's session, remove it.
        """

        pass


class SessionKeyStorage(SessionStorage):
    def __init__(self, session_key: str):
        self.session_key = session_key

    def load(self, request: HttpRequest) -> Optional[Dict[str, Any]]:
        return request.session.get(self.session_key)

    def save(self, request: HttpRequest, data: Dict[str, Any]):
        request.session[self.session_key] = data

    def clear(self, request: HttpRequest):
        if self.session_key in request.session:
            request.session.pop(self.session_key)


class SessionObjectTypeOptions(ObjectTypeOptions):
    form_class = None
    session_storage: SessionStorage


class DjangoSessionFormObjectType(graphene.ObjectType):
    """
    An abstract class for defining a GraphQL object type based on the
    fields of a Django Form, along with a GraphQL resolver for retrieving them
    from a request session.

    The inner Meta class must define a `form_class` that points to a Django Form
    class, and either a `session_key` that specifies the request session key the object's
    data can be retrieved from, or a `session_storage` that manages the storage of
    the object's data.

    If a Django form's cleaned data includes keys that don't correspond to form
    fields, the form can describe these keys via an 'extra_graphql_output_fields'
    dict attribute that maps the keys to GraphQL scalars.
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        form_class=None,
        session_key="",
        session_storage=None,
        exclude=(),
        _meta=None,
        **options,
    ):
        if not _meta:
            _meta = SessionObjectTypeOptions(cls)

        if session_key:
            _meta.session_storage = SessionKeyStorage(session_key)
        elif session_storage:
            assert isinstance(session_storage, SessionStorage)
            _meta.session_storage = session_storage
        else:
            raise AssertionError(
                f"{cls.__name__} must define either Meta.session_key or Meta.session_storage."
            )

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

        value = cls._meta.session_storage.load(request)
        if value is None:
            return None
        return cls.migrate_dict(value)

    @classmethod
    def clear_from_request(cls, request: HttpRequest):
        """
        If the object data exists in the given request's session, remove it.
        """

        cls._meta.session_storage.clear(request)

    @classmethod
    def _resolve_from_session(cls, parent, info: ResolveInfo):
        form_name = cls._meta.form_class.__name__
        request = info.context
        obinfo = cls._meta.session_storage.load(request)
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
                logger.exception(f"Error deserializing {form_name} from session")
                cls._meta.session_storage.clear(request)
        return None

    @classmethod
    def field(cls, **kwargs):
        """
        Return a GraphQL Field associated with this type, with a resolver
        that retrieves the object of this type from the request session, if
        it exists.
        """

        return graphene.Field(cls, resolver=cls._resolve_from_session, **kwargs)

    @classmethod
    def save_form_to_session(cls, form, request: HttpRequest):
        assert form.is_valid()
        assert isinstance(form, cls._meta.form_class)
        cls._meta.session_storage.save(request, form.cleaned_data)


class StoreToSessionFormOptions(DjangoFormMutationOptions):
    source: DjangoSessionFormObjectType


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

        _meta.source = source
        options["form_class"] = source._meta.form_class

        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        request = info.context
        cls._meta.source.save_form_to_session(form, request)
        return cls.mutation_success()
