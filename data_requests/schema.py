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


SNIPPET_MAX_ROWS = 100


class DataRequestResult(graphene.ObjectType):
    csv_url = graphene.String(required=True)
    snippet_rows = graphene.String(required=True)
    snippet_max_rows = graphene.Int(required=True)


def get_csv_snippet(rows: Iterator[List[Any]]) -> str:
    return "".join(list(generate_streaming_csv(itertools.islice(rows, 0, SNIPPET_MAX_ROWS + 1))))


def resolve_multi_landlord(root, info, landlords: str) -> Optional[DataRequestResult]:
    snippet = get_csv_snippet(db_queries.get_csv_rows_for_multi_landlord_query(landlords))
    snippet_rows = list(filter(None, list(csv.reader(snippet.split("\n")))))
    if len(snippet_rows) <= 1:
        # It's either completely empty or just a header row.
        return None
    return DataRequestResult(
        csv_url=(
            reverse("data_requests:multi-landlord-csv") + f"?q={urllib.parse.quote(landlords)}"
        ),
        snippet_rows=json.dumps(snippet_rows),
        snippet_max_rows=SNIPPET_MAX_ROWS,
    )


@schema_registry.register_queries
class DataRequestQuery:
    data_request_multi_landlord = graphene.Field(
        DataRequestResult, landlords=graphene.String(), resolver=resolve_multi_landlord
    )
