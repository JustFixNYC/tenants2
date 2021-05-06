import graphene

from . import schema_registry

# Importing this module will register our base queries/mutations.
from . import schema_base  # noqa
from . import schema_admin  # noqa


SessionInfo = schema_registry.build_session_info()

Mutations = schema_registry.build_mutations()

Query = schema_registry.build_query()

schema = graphene.Schema(query=Query, mutation=Mutations)
