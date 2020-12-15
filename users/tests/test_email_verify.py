from io import StringIO
import json
from django.core import signing
from django.core.management import call_command, CommandError
from freezegun import freeze_time
import pytest

from .factories import UserFactory
from users import email_verify
from users.email_verify import (
    verify_code,
    send_verification_email,
    send_verification_email_async,
    SigningPayload,
)


def test_send_verification_email_works(db, mailoutbox):
    user = UserFactory(email="boop@jones.com")
    send_verification_email(user.pk)
    assert len(mailoutbox) == 1
    mail = mailoutbox[0]
    assert mail.to == ["boop@jones.com"]
    assert "Hello Boop" in mail.body
    assert "code=" in mail.body


def test_send_verification_email_async_works(db, mailoutbox):
    user = UserFactory(email="boop@jones.com")
    send_verification_email_async(user.pk)
    assert len(mailoutbox) == 1


def test_sendverificationemail_works(db, mailoutbox):
    UserFactory(username="boop", email="boop@jones.com")
    stdout = StringIO()
    call_command("sendverificationemail", "boop", stdout=stdout)
    assert "Verification email sent" in stdout.getvalue()
    assert len(mailoutbox) == 1


def test_sendverificationemail_raises_error_if_user_has_no_email(db):
    UserFactory(username="boop", email="")
    with pytest.raises(CommandError, match="does not have an email"):
        call_command("sendverificationemail", "boop")


def sign_str(value: str) -> str:
    return signing.dumps(value, salt=email_verify.VERIFICATION_SALT)


def sign(value: SigningPayload) -> str:
    return sign_str(value.serialize())


class TestSigningPayload:
    @pytest.mark.parametrize(
        "value",
        [
            "zzz",
            json.dumps(1),
            json.dumps(None),
            json.dumps("xy"),
            json.dumps([1, 2]),
            json.dumps(["too few"]),
            json.dumps(["one", "too", "many"]),
        ],
    )
    def test_it_returns_none_on_bad_payloads(self, value):
        assert SigningPayload.deserialize(value) is None

    def test_it_returns_tuple_on_good_payloads(self):
        value = json.dumps(["myusername", "boop@jones.com"])
        assert SigningPayload.deserialize(value) == ("myusername", "boop@jones.com")


class TestVerifyCode:
    def test_it_returns_invalid_code(self):
        for code in ["", "blarg"]:
            assert verify_code(code) == ("invalid_code", None)

    def test_it_returns_signature_expired(self):
        with freeze_time("2001-01-01"):
            code = sign(SigningPayload("blarg", "blarg@bop.com"))
        assert verify_code(code) == ("expired", None)

    def test_it_returns_invalid_username(self, db):
        assert verify_code(sign(SigningPayload("abcdef", "j"))) == ("invalid_username", None)

    def test_it_returns_already_verified(self, db):
        user = UserFactory(username="boop", email="boop@jones.com", is_email_verified=True)
        assert verify_code(sign(SigningPayload.from_user(user))) == ("already_verified", user)

    def test_it_returns_ok_sets_is_email_verified(self, db):
        user = UserFactory(username="boop", email="boop@jones.com")
        assert verify_code(sign(SigningPayload.from_user(user))) == ("ok", user)
        user.refresh_from_db()
        assert user.is_email_verified is True

    def test_it_returns_malformed_payload(self):
        assert verify_code(sign_str("not json!")) == ("malformed_payload", None)

    def test_it_returns_email_mismatch(self, db):
        UserFactory(username="boop", email="boop@jones.com")
        assert verify_code(sign(SigningPayload("boop", "some@other.com"))) == (
            "email_mismatch",
            None,
        )
