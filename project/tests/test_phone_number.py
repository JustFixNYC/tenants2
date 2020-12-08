import pytest
from django.core.exceptions import ValidationError

from project.util.phone_number import validate_phone_number, USPhoneNumberField, humanize


@pytest.mark.parametrize(
    "value, excmsg",
    [
        ("5", "U.S. phone numbers must be 10 digits."),
        ("b125551234", "Phone numbers can only contain digits."),
        ("1917451234", "191 is an invalid area code."),
    ],
)
def test_validate_phone_number_raises_validation_errors(value, excmsg):
    with pytest.raises(ValidationError) as excinfo:
        validate_phone_number(value)
    assert excinfo.value.args[0] == excmsg


def test_validate_phone_number_works_with_valid_phone_numbers():
    validate_phone_number("4151234567")


@pytest.mark.parametrize("phone_number", ["5551234567", "555-123-4567", "+1 555 123-4567"])
def test_phone_number_field_works(phone_number):
    assert USPhoneNumberField().clean(phone_number) == "5551234567"


def test_phone_number_field_errors_on_really_long_input():
    with pytest.raises(ValidationError) as exc_info:
        USPhoneNumberField().clean("5551234567" * 30)
    assert "Ensure this value has at most " in str(exc_info.value)


@pytest.mark.parametrize("bad_phone_number", ["555123456", "555-123-456", "+2 555 123-4567"])
def test_phone_number_field_raises_errors(bad_phone_number):
    with pytest.raises(ValidationError) as exc_info:
        USPhoneNumberField().clean(bad_phone_number)
    assert "This does not look like a U.S. phone number." in str(exc_info.value)


def test_phone_number_field_raises_error_on_bad_area_code():
    with pytest.raises(ValidationError, match="area code"):
        USPhoneNumberField().clean("1912311234")


def test_humanize_works():
    assert humanize("") == ""
    assert humanize("5551234567") == "(555) 123-4567"
    assert humanize("999999999999999999") == "999999999999999999"
