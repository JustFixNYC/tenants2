from .test_hardship_declaration import create_user_with_all_decl_info


def test_example_declaration_works(client):
    res = client.get("/en/evictionfree/example-declaration.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"


def test_preview_declaration_raises_404_for_logged_out_users(client):
    res = client.get("/en/evictionfree/preview-declaration.pdf")
    assert res.status_code == 404


def test_preview_declaration_renders_for_users_with_declaration_info(
    client, db, fake_fill_hardship_pdf
):
    user = create_user_with_all_decl_info()
    client.force_login(user)
    res = client.get("/en/evictionfree/preview-declaration.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"


def test_preview_cover_letter_raises_404_for_logged_out_users(client):
    res = client.get("/en/evictionfree/preview-cover-letter.pdf")
    assert res.status_code == 404


def test_preview_cover_letter_renders_for_users_with_declaration_info(client, db):
    user = create_user_with_all_decl_info()
    client.force_login(user)
    res = client.get("/en/evictionfree/preview-cover-letter.pdf")
    assert res.status_code == 200
    assert res["Content-Type"] == "application/pdf"
