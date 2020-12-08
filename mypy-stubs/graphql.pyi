# This is taken from examining the source code for graphql,
# which appears to actually use mypy.

from typing import List, Union, Dict, Optional, Any
from django.http import HttpRequest

class ResolveInfo(object):
    field_name: str

    # TODO: This is actually a List[Field].
    field_asts: List[Any]

    # TODO: This is actually a Union[GraphQLList, GraphQLObjectType, GraphQLScalarType].
    return_type: Any

    # TODO: This is actually a GraphQLObjectType.
    parent_type: Any

    # TODO: This is actually a GraphQLSchema.
    schema: Any

    fragments: Dict

    root_value: Optional[type]

    # TODO: This is actually an OperationDefinition.
    operation: Any

    variable_values: Dict

    # This is actually Optional[Any], but Graphene-Django sets it to
    # a Django request.
    context: HttpRequest

    path: Optional[Union[List[Union[int, str]], List[str]]] = None

# This indicates that this typing is incomplete.
def __getattr__(attr: str) -> Any: ...
