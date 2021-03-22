from users import views
from users.email_verify import VERIFY_OK
from .factories import UserFactory


def test_verify_email_shows_error(client):
    res = client.get("/verify-email")
    assert res.status_code == 200
    assert b"unable to verify" in res.content


def test_verify_email_works(db, client, monkeypatch):
    user = UserFactory()
    monkeypatch.setattr(views, "verify_code", lambda code: (VERIFY_OK, user))
    res = client.get("/verify-email")
    assert res.status_code == 200
    assert b"Thank you for verifying" in res.content
