def test_it_does_not_explode(client):
    res = client.get("/data-requests/multi-landlord.csv?q=boop%20jones")
    data = b"".join(res.streaming_content).decode("utf-8")
    assert data == "error\r\nThis functionality requires WOW integration.\r\n"
