from typing import List, Type
import graphene
from graphene.utils.str_converters import to_snake_case
from graphene.types.mutation import Mutation
from django.utils.module_loading import autodiscover_modules


_is_initialized = False

_session_info_classes: List[Type] = []

_queries_classes: List[Type] = []

_mutations_classes: List[Type] = []


def register_session_info(klass: Type) -> Type:
    """
    Register a class containing a GraphQL schema to be exposed under the
    site's "session" GraphQL query.
    """

    _session_info_classes.append(klass)
    return klass


def register_queries(klass: Type) -> Type:
    """
    Register a class containing a GraphQL schema to be exposed by the site.
    """

    _queries_classes.append(klass)
    return klass


def register_mutation(klass: Type[Mutation]) -> Type:
    """
    Register a class representing a GraphQL mutation to be exposed by the site.
    """

    name = f"{klass.__name__}Mixin"
    attr_name = to_snake_case(klass.__name__)
    _mutations_classes.append(type(name, tuple(), {attr_name: klass.Field(required=True)}))

    return klass


def _build_graphene_object_type(name: str, classes: List[Type], __doc__: str) -> Type:
    # Sort the classes by their names to ensure that they're ultimately
    # listed in our Schema in an order that's independent of the order in
    # which the modules that registered them were imported.
    classes = sorted(classes, key=lambda klass: klass.__name__)

    return type(name, tuple([*classes, graphene.ObjectType]), {"__doc__": __doc__})


def build_session_info() -> Type:
    _init()
    return _build_graphene_object_type(
        "SessionInfo", _session_info_classes, "Information about the current user."
    )


def build_query() -> Type:
    _init()
    return _build_graphene_object_type("Query", _queries_classes, "Query the site.")


def build_mutations() -> Type:
    _init()
    return _build_graphene_object_type(
        "Mutations", _mutations_classes, "Mutate (i.e., change the state of) the site."
    )


def _init():
    global _is_initialized

    if not _is_initialized:
        _is_initialized = True
        autodiscover_modules("schema")
