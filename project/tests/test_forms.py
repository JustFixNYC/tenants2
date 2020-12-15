import pytest
from unittest.mock import patch

from project.forms import (
    LoginForm,
    YesNoRadiosField,
)


def test_login_form_is_invalid_if_fields_are_invalid():
    assert LoginForm(data={"phone_number": "", "password": ""}).is_valid() is False
    assert LoginForm(data={"phone_number": "", "password": "123"}).is_valid() is False
    assert LoginForm(data={"phone_number": "5551234567", "password": ""}).is_valid() is False


def test_login_form_is_invalid_if_auth_failed():
    with patch("project.forms.authenticate", return_value=None) as auth:
        form = LoginForm(data={"phone_number": "5551234567", "password": "boop"})
        assert form.is_valid() is False
        auth.assert_called_once_with(phone_number="5551234567", password="boop")
        assert form.errors == {"__all__": ["Invalid phone number or password."]}
        assert form.authenticated_user is None


def test_login_form_is_valid_if_auth_succeeded():
    fake_user = {"fake": "user"}
    with patch("project.forms.authenticate", return_value=fake_user):
        form = LoginForm(data={"phone_number": "5551234567", "password": "boop"})
        assert form.is_valid() is True
        assert form.authenticated_user is fake_user


class TestYesNoRadiosField:
    @pytest.mark.parametrize(
        "value,expected",
        [
            ("", None),
            (None, None),
            ("True", True),
            ("False", False),
        ],
    )
    def test_coerce_works(self, value, expected):
        assert YesNoRadiosField.coerce(value) is expected

    def test_raises_value_error_on_unexpected_value(self):
        with pytest.raises(ValueError, match="Invalid YesNoRadiosField value: blah"):
            YesNoRadiosField.coerce("blah")
