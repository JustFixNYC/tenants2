from data_requests import schema


def test_it_returns_none_on_empty_query():
    assert schema.resolve_multi_landlord(None, None, "") is None


def test_it_returns_errors(graphql_client):
    res = graphql_client.execute(
        """
        query {
            dataRequestMultiLandlord(landlords: "boop jones") {
                csvUrl,
                snippetRows,
                snippetMaxRows
            }
        }
        """
    )["data"]["dataRequestMultiLandlord"]

    assert res == {
        "csvUrl": "/data-requests/multi-landlord.csv?q=boop%20jones",
        "snippetRows": '[["error"], ["This functionality requires WOW integration."]]',
        "snippetMaxRows": 100,
    }
