import pytest
import json

from project.util.streaming_json import (
    generate_json_rows,
    generate_streaming_json,
    streaming_json_response,
)


rows = [
    {
        "a": 1,
        "b": "hi",
    },
    {"a": 2, "b": "boop\u2026"},
]


def test_generate_json_rows_works(db):
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute("CREATE TABLE blarg (foo VARCHAR(5), bar VARCHAR(5), baz INTEGER[])")
        cursor.execute(
            "INSERT INTO blarg (foo, bar, baz) VALUES "
            "('hi', 'there', '{1,2}'), ('yo', 'dawg', '{3,4}')"
        )
        cursor.execute("SELECT foo, bar, baz FROM blarg")
        rows = generate_json_rows(cursor)
        assert next(rows) == {"foo": "hi", "bar": "there", "baz": [1, 2]}
        assert next(rows) == {"foo": "yo", "bar": "dawg", "baz": [3, 4]}
        with pytest.raises(StopIteration):
            next(rows)


def test_generate_streaming_json_works():
    g = generate_streaming_json(rows)
    assert next(g) == "["
    assert json.loads(next(g)) == rows[0]
    assert next(g) == ","
    assert json.loads(next(g)) == rows[1]
    assert next(g) == "]"
    with pytest.raises(StopIteration):
        next(g)


def test_streaming_json_response_works():
    r = streaming_json_response(rows, "boop.json")
    assert r["Content-Type"] == "application/json"
    assert r["Content-Disposition"] == 'attachment; filename="boop.json"'
    assert json.loads(b"".join(list(r)).decode("utf-8")) == rows
