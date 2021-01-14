def test_example_declaration_works(client):
    res = client.get("/en/evictionfree/example-declaration.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
