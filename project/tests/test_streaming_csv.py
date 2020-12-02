import pytest

from project.util.streaming_csv import (
    transform_csv_row,
    generate_streaming_csv,
    streaming_csv_response,
)


rows = [["a", "b", "c"], ["d", "e", "f\u2026"]]


def test_generate_streaming_csv_works():
    g = generate_streaming_csv(rows)
    assert next(g) == "a,b,c\r\n"
    assert next(g) == "d,e,f\u2026\r\n"
    with pytest.raises(StopIteration):
        next(g)


def test_streaming_csv_response_works():
    r = streaming_csv_response(rows, "boop.csv")
    assert r["Content-Type"] == "text/csv"
    assert r["Content-Disposition"] == 'attachment; filename="boop.csv"'
    assert list(r) == [b"a,b,c\r\n", "d,e,f\u2026\r\n".encode("utf-8")]


def test_transform_csv_row_works():
    assert list(transform_csv_row(("blah", ["no", 2]))) == ["blah", "no, 2"]
