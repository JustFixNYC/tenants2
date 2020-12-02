import pytest

from texting_history.query_parser import Query


@pytest.mark.parametrize(
    "query,expected",
    [
        ("blah", Query(full_name="blah")),
        ("5551234567", Query(phone_number="5551234567")),
        ("has:hpa", Query(has_hpa_packet=True)),
        ('"blarg"', Query(message_body="blarg")),
    ],
)
def test_parse_works(query, expected):
    assert Query.parse(query) == expected
