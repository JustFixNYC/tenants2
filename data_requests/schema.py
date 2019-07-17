from typing import Optional, List
import graphene
from project import schema_registry


class DataRequestResult(graphene.ObjectType):
    csv_url = graphene.String(required=True)
    csv_snippet = graphene.String(required=True)


def split_into_list(value: str) -> List[str]:
    '''
    >>> split_into_list('boop,, blop')
    ['boop', 'blop']
    '''

    items = value.split(',')
    return list(filter(None, [item.strip() for item in items]))


def resolve_multi_landlord(root, info, landlords: str) -> Optional[DataRequestResult]:
    landlords_list = split_into_list(landlords)
    if not landlords_list:
        return None
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
