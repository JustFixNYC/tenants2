from django.core import signing
from freezegun import freeze_time

from .factories import UserFactory
from users import email_verify
from users.email_verify import verify_code, send_verification_email


def test_send_verification_email_works(db, mailoutbox):
    user = UserFactory(email='boop@jones.com')
    send_verification_email(user)
    assert len(mailoutbox) == 1
    mail = mailoutbox[0]
    assert mail.to == ['boop@jones.com']
    assert 'Hello Boop' in mail.body
    assert 'code=' in mail.body


def sign(value: str) -> str:
    return signing.dumps(value, salt=email_verify.VERIFICATION_SALT)


class TestVerifyCode:
    def test_it_returns_invalid_code(self):
        for code in ['', 'blarg']:
            assert verify_code(code) == ('invalid_code', None)

    def test_it_returns_signature_expired(self):
        with freeze_time('2001-01-01'):
            code = sign('blarg')
        assert verify_code(code) == ('expired', None)

    def test_it_returns_invalid_username(self, db):
        assert verify_code(sign('abcdef')) == ('invalid_username', None)

    def test_it_returns_already_verified(self, db):
        user = UserFactory(username='boop', email='boop@jones.com', is_email_verified=True)
        assert verify_code(sign('boop')) == ('already_verified', user)

    def test_it_returns_ok_sets_is_email_verified(self, db):
        user = UserFactory(username='boop', email='boop@jones.com')
        assert verify_code(sign('boop')) == ('ok', user)
        user.refresh_from_db()
        assert user.is_email_verified is True
