from typing import Optional, Iterator, List, Any
import csv
import json
import itertools
import urllib.parse
import graphene
from django.urls import reverse

from project import schema_registry
from project.util.streaming_csv import generate_streaming_csv
from . import db_queries


class DataRequestResult(graphene.ObjectType):
    csv_url = graphene.String(required=True)
    csv_snippet = graphene.String(required=True)


def get_csv_snippet(rows: Iterator[List[Any]]) -> str:
    return ''.join(list(generate_streaming_csv(itertools.islice(rows, 0, 5))))


def resolve_multi_landlord(root, info, landlords: str) -> Optional[DataRequestResult]:
    snippet = get_csv_snippet(db_queries.get_csv_rows_for_multi_landlord_query(landlords))
    snippet = json.dumps(list(csv.reader(snippet.split('\n'))))
    return DataRequestResult(
        csv_url=(reverse('data_requests:multi-landlord-csv') +
                 f'?q={urllib.parse.quote(landlords)}'),
        csv_snippet=snippet
    )


@schema_registry.register_queries
class DataRequestQuery:
    data_request_multi_landlord = graphene.Field(
        DataRequestResult,
        landlords=graphene.String(),
        resolver=resolve_multi_landlord
    )
