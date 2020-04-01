from django.core.exceptions import ValidationError
import pytest

from project.util.mailing_address import MailingAddress


def test_is_address_populated_works():
    ma = MailingAddress()
    assert ma.is_address_populated() is False
    ma.primary_line = 'hi'
    assert ma.is_address_populated() is False
    ma.city = 'there'
    assert ma.is_address_populated() is False
    ma.state = 'NY'
    assert ma.is_address_populated() is False
    ma.zip_code = '12345'
    assert ma.is_address_populated() is True


def test_state_is_validated():
    MailingAddress(state="NY").full_clean()

    with pytest.raises(ValidationError):
        MailingAddress(state="ZZ").full_clean()
