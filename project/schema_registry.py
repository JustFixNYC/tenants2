"""
The schema registry keeps track of what Graphene-Django GraphQL
queries and mutations are exposed on our server, making it easier
for us to define new ones in a Django-like way.

With the schema registry, every Django app can have its own
`schema.py` file in its root directory, which is automatically
imported by the schema registry.  This file can then use
decorators like `@register_queries` and `@register_mutation`
to automatically add to the site's GraphQL schema.

Registering queries
-------------------

For example, consider a `schema.py` with the following contents:

    from project import schema_registry

    @schema_registry.register_queries
    class MyQueries:
        my_int = graphene.Int()

        def resolve_my_int(self, info):
            return 5

This will automatically create a GraphQL field called `myInt`
on the server, which always resolves to `5`.

Of special consideration is the server's `session` GraphQL
field: *all* of this object's fields are automatically
resolved and passed to the front-end on every render. To add
a field to `session`, simply use `register_session_info`
instead of `register_queries`.

Registering mutations
---------------------

Consider a `schema.py` with the following contents:

    import graphene
    from graphene_django import DjangoObjectType

    from project import schema_registry

    @schema_registry.register_mutation
    class MyMutation(graphene.Mutation):
        class Arguments:
            # The input arguments for this mutation
            text = graphene.String(required=True)

        # The class attributes define the response of the mutation
        funky_result = graphene.Int()

        @classmethod
        def mutate(cls, root, info, text):
            print("TEXT IS " + text)
            # Notice we return an instance of this mutation
            return MyMutation(funky_result=5)

This will automatically create a GraphQL mutation called `myMutation`
on the server, which takes a string argument called `text`, and, after
printing the text to the console, returns a field called `funkyResult`,
which always resolves to 5.
"""

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
    site's "session" GraphQL field.
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
