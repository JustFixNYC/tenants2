from users import views


def test_verify_email_shows_error(client):
    res = client.get('/verify-email')
    assert res.status_code == 200
    assert b'unable to verify' in res.content


def test_verify_email_works(client, monkeypatch):
    monkeypatch.setattr(views, 'verify_code', lambda code: ('ok', 'fake user'))
    res = client.get('/verify-email')
    assert res.status_code == 200
    assert b'Thank you for verifying' in res.content
