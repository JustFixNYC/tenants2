from data_requests import schema


def test_it_returns_none_on_empty_query():
    assert schema.resolve_multi_landlord(None, None, '') is None
