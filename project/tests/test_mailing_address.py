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


def test_address_lines_for_mailing_works():
    ma = MailingAddress()
    assert ma.address_lines_for_mailing == []
    ma.primary_line = '123 Boop St.'
    assert ma.address_lines_for_mailing == []
    ma.city = 'Brooklyn'
    assert ma.address_lines_for_mailing == []
    ma.state = 'NY'
    assert ma.address_lines_for_mailing == []
    ma.zip_code = '12345'
    assert ma.address_lines_for_mailing == [
        '123 Boop St.',
        'Brooklyn, NY 12345'
    ]
    ma.secondary_line = 'SECONDARY LINE'
    assert ma.address_lines_for_mailing == [
        '123 Boop St.',
        'SECONDARY LINE',
        'Brooklyn, NY 12345'
    ]


def test_get_address_as_dict_works():
    kwargs = dict(
        primary_line="123 Zoom St.",
        secondary_line="hmm",
        city="Zoomville",
        state="NY",
        zip_code="12345",
        urbanization="huh",
    )
    ma = MailingAddress(**kwargs)
    assert ma.get_address_as_dict() == kwargs
