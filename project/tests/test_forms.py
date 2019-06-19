import pytest
from unittest.mock import patch
from django.forms import ValidationError

from project.forms import (
    LoginForm,
    YesNoRadiosField,
    USPhoneNumberField
)


def test_login_form_is_invalid_if_fields_are_invalid():
    assert LoginForm(data={'phone_number': '', 'password': ''}).is_valid() is False
    assert LoginForm(data={'phone_number': '', 'password': '123'}).is_valid() is False
    assert LoginForm(data={'phone_number': '5551234567', 'password': ''}).is_valid() is False


def test_login_form_is_invalid_if_auth_failed():
    with patch('project.forms.authenticate', return_value=None) as auth:
        form = LoginForm(data={'phone_number': '5551234567', 'password': 'boop'})
        assert form.is_valid() is False
        auth.assert_called_once_with(phone_number='5551234567', password='boop')
        assert form.errors == {
            '__all__': ['Invalid phone number or password.']
        }
        assert form.authenticated_user is None


def test_login_form_is_valid_if_auth_succeeded():
    fake_user = {'fake': 'user'}
    with patch('project.forms.authenticate', return_value=fake_user):
        form = LoginForm(data={'phone_number': '5551234567', 'password': 'boop'})
        assert form.is_valid() is True
        assert form.authenticated_user is fake_user


@pytest.mark.parametrize("phone_number", [
    '5551234567',
    '555-123-4567',
    '+1 555 123-4567'
])
def test_phone_number_field_works(phone_number):
    assert USPhoneNumberField().clean(phone_number) == '5551234567'


def test_phone_number_field_errors_on_really_long_input():
    with pytest.raises(ValidationError) as exc_info:
        USPhoneNumberField().clean('5551234567' * 30)
    assert 'Ensure this value has at most ' in str(exc_info.value)


@pytest.mark.parametrize("bad_phone_number", [
    '555123456',
    '555-123-456',
    '+2 555 123-4567'
])
def test_phone_number_field_raises_errors(bad_phone_number):
    with pytest.raises(ValidationError) as exc_info:
        USPhoneNumberField().clean(bad_phone_number)
    assert 'This does not look like a U.S. phone number.' in str(exc_info.value)


def test_phone_number_field_raises_error_on_bad_area_code():
    with pytest.raises(ValidationError, match="area code"):
        USPhoneNumberField().clean("1912311234")


class TestYesNoRadiosField:
    @pytest.mark.parametrize('value,expected', [
        ('', None),
        (None, None),
        ('True', True),
        ('False', False),
    ])
    def test_coerce_works(self, value, expected):
        assert YesNoRadiosField.coerce(value) is expected

    def test_raises_value_error_on_unexpected_value(self):
        with pytest.raises(ValueError, match='Invalid YesNoRadiosField value: blah'):
            YesNoRadiosField.coerce('blah')
