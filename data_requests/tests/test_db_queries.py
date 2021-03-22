from data_requests import db_queries


def test_it_returns_sql_errors(db):
    # This will fail because our default database doesn't have the DB schema of WOW.
    result = list(db_queries._multi_landlord_query([("boop", "jones")], "default"))
    assert result == [["error"], ["Alas, an error occurred."]]
