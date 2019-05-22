from typing import List, Type
import graphene
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


def register_mutations(klass: Type) -> Type:
    """
    Register a class containing GraphQL mutations to be exposed by the site.
    """

    _mutations_classes.append(klass)
    return klass


def _build_graphene_object_type(name: str, classes: List[Type], __doc__: str) -> Type:
    return type(name, tuple([*classes, graphene.ObjectType]), {
        '__doc__': __doc__
    })


def build_session_info() -> Type:
    _init()
    return _build_graphene_object_type(
        "SessionInfo",
        _session_info_classes,
        'Information about the current user.'
    )


def build_query() -> Type:
    _init()
    return _build_graphene_object_type(
        "Query",
        _queries_classes,
        'Query the site.'
    )


def build_mutations() -> Type:
    _init()
    return _build_graphene_object_type(
        "Mutations",
        _mutations_classes,
        'Mutate (i.e., change the state of) the site.'
    )


def _init():
    global _is_initialized

    if not _is_initialized:
        _is_initialized = True
        autodiscover_modules('schema')
