from typing import List, Type
import graphene
from django.utils.module_loading import autodiscover_modules


_is_initialized = False

_session_info_classes: List[Type] = []

_queries_classes: List[Type] = []

_mutations_classes: List[Type] = []


def register_session_info(klass: Type) -> Type:
    print(f"Registering session info {klass.__name__}.")
    _session_info_classes.append(klass)
    return klass


def register_queries(klass: Type) -> Type:
    print(f"Registering queries {klass.__name__}.")
    _queries_classes.append(klass)
    return klass


def register_mutations(klass: Type) -> Type:
    print(f"Registering mutations {klass.__name__}.")
    _mutations_classes.append(klass)
    return klass


def _build_graphene_object_type(name: str, classes: List[Type]) -> Type:
    return type(name, tuple([*classes, graphene.ObjectType]), {})


def build_session_info() -> Type:
    _init()
    return _build_graphene_object_type("SessionInfo", _session_info_classes)


def build_query() -> Type:
    _init()
    return _build_graphene_object_type("Query", _queries_classes)


def build_mutations() -> Type:
    _init()
    return _build_graphene_object_type("Mutations", _mutations_classes)


def _init():
    global _is_initialized

    if not _is_initialized:
        _is_initialized = True
        autodiscover_modules('schema')
