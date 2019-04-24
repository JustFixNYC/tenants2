import pytest
import json

from project.util.streaming_json import (
    generate_json_rows,
    generate_streaming_json,
    streaming_json_response
)


rows = [{
    'a': 1,
    'b': 'hi',
}, {
    'a': 2,
    'b': 'boop\u2026'
}]


def test_generate_json_rows_works(db):
    from django.db import connection

    with connection.cursor() as cursor:
        cursor.execute('CREATE TABLE blarg (foo VARCHAR(5), bar VARCHAR(5))')
        cursor.execute("INSERT INTO blarg (foo, bar) VALUES ('hi', 'there'), ('yo', 'dawg')")
        cursor.execute('SELECT foo, bar FROM blarg')
        rows = generate_json_rows(cursor)
        assert next(rows) == {'foo': 'hi', 'bar': 'there'}
        assert next(rows) == {'foo': 'yo', 'bar': 'dawg'}
        with pytest.raises(StopIteration):
            next(rows)


def test_generate_streaming_json_works():
    g = generate_streaming_json(rows)
    assert next(g) == '['
    assert json.loads(next(g)) == rows[0]
    assert next(g) == ','
    assert json.loads(next(g)) == rows[1]
    assert next(g) == ']'
    with pytest.raises(StopIteration):
        next(g)


def test_streaming_json_response_works():
    r = streaming_json_response(rows, 'boop.json')
    assert r['Content-Type'] == 'application/json'
    assert r['Content-Disposition'] == 'attachment; filename="boop.json"'
    assert json.loads(b''.join(list(r)).decode('utf-8')) == rows
