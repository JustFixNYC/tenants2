from django.core.exceptions import ValidationError
import pytest

from project.util.mailing_address import (
    MailingAddress,
    ZipCodeValidator,
    is_zip_code_valid_for_state,
)


EXAMPLE_KWARGS = dict(
    primary_line="123 Zoom St.",
    secondary_line="hmm",
    city="Zoomville",
    state="NY",
    zip_code="12345",
    urbanization="huh",
)


def test_as_lob_params_works_with_populated_addr():
    kwargs = dict(primary_line="150 Court St. #2", city="Brooklyn", state="NY", zip_code="11201")
    ad = MailingAddress(**kwargs)
    assert ad.as_lob_params() == kwargs


def test_as_lob_params_returns_empty_dict_for_unpopulated_addr():
    ad = MailingAddress()
    assert ad.as_lob_params() == {}


def test_is_address_populated_works():
    ma = MailingAddress()
    assert ma.is_address_populated() is False
    ma.primary_line = "hi"
    assert ma.is_address_populated() is False
    ma.city = "there"
    assert ma.is_address_populated() is False
    ma.state = "NY"
    assert ma.is_address_populated() is False
    ma.zip_code = "12345"
    assert ma.is_address_populated() is True


def test_state_is_validated():
    MailingAddress(state="NY").full_clean()

    with pytest.raises(ValidationError):
        MailingAddress(state="ZZ").full_clean()


def test_address_lines_for_mailing_works():
    ma = MailingAddress()
    assert ma.address_lines_for_mailing == []
    ma.primary_line = "123 Boop St."
    assert ma.address_lines_for_mailing == []
    ma.city = "Brooklyn"
    assert ma.address_lines_for_mailing == []
    ma.state = "NY"
    assert ma.address_lines_for_mailing == []
    ma.zip_code = "12345"
    assert ma.address_lines_for_mailing == ["123 Boop St.", "Brooklyn, NY 12345"]
    ma.secondary_line = "SECONDARY LINE"
    assert ma.address_lines_for_mailing == ["123 Boop St.", "SECONDARY LINE", "Brooklyn, NY 12345"]


def test_get_address_as_dict_works():
    ma = MailingAddress(**EXAMPLE_KWARGS)
    assert ma.get_address_as_dict() == EXAMPLE_KWARGS


def test_clear_address_works():
    ma = MailingAddress(**EXAMPLE_KWARGS)
    ma.clear_address()
    assert ma.primary_line == ""
    assert ma.secondary_line == ""
    assert ma.urbanization == ""
    assert ma.city == ""
    assert ma.state == ""
    assert ma.zip_code == ""


@pytest.mark.parametrize(
    "zip_code",
    [
        "11201",
        "11201-1234",
    ],
)
def test_zip_code_validator_accepts_valid_zip_codes(zip_code):
    ZipCodeValidator()(zip_code)


@pytest.mark.parametrize(
    "zip_code",
    [
        "blarg",
        "1234",
        "123456",
        "123456789",
        "1234-56789",
    ],
)
def test_zip_code_validator_rejects_invalid_zip_codes(zip_code):
    with pytest.raises(ValidationError, match="Enter a valid U.S. zip code"):
        ZipCodeValidator()(zip_code)


@pytest.mark.parametrize(
    "zip_code,state,expected",
    [
        ("11201", "NY", True),
        ("00501", "NY", True),
        ("00123", "NY", False),
        ("43220", "NY", False),
        ("90210", "CA", True),
    ],
)
def test_is_zip_code_valid_for_state(zip_code, state, expected):
    assert is_zip_code_valid_for_state(zip_code, state) is expected
