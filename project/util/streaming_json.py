import json
from typing import Any, Iterator, Dict
from django.http import StreamingHttpResponse
from django.core.serializers.json import DjangoJSONEncoder


def generate_json_rows(cursor) -> Iterator[Dict[str, Any]]:
    columns = [column.name for column in cursor.description]

    while True:
        row = cursor.fetchone()
        if row is None:
            break
        yield dict(zip(columns, row))


def generate_streaming_json(rows: Iterator[Dict[str, Any]]) -> Iterator[str]:
    yield "["
    yielded_first = False
    for row in rows:
        if yielded_first:
            yield ","
        yielded_first = True
        yield json.dumps(row, cls=DjangoJSONEncoder)
    yield "]"


def streaming_json_response(rows: Iterator[Dict[str, Any]], filename: str) -> StreamingHttpResponse:
    response = StreamingHttpResponse(generate_streaming_json(rows), content_type="application/json")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
