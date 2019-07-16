from typing import Optional
import graphene
from project import schema_registry


class DataRequestResult(graphene.ObjectType):
    csv_url = graphene.String(required=True)
    csv_snippet = graphene.String(required=True)


def resolve_multi_landlord(root, info, landlords: str) -> Optional[DataRequestResult]:
    return DataRequestResult(
        csv_url="https://example.com/todo-fill-this-out",
        csv_snippet=f"TODO: put CSV snippet for '{landlords}' search here"
    )


@schema_registry.register_queries
class DataRequestQuery:
    data_request_multi_landlord = graphene.Field(
        DataRequestResult,
        landlords=graphene.String(),
        resolver=resolve_multi_landlord
    )
