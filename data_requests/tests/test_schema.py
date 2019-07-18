from data_requests import schema


def test_it_does_not_explode():
    assert schema.resolve_multi_landlord(None, None, '') is None
