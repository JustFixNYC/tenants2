import pytest
from unittest.mock import patch

from users.tests.factories import UserFactory
from project.forms import (
    LoginForm,
    YesNoRadiosField,
    OptionalUniqueEmailForm,
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

    @pytest.mark.parametrize(
        "value,expected",
        [
            (None, ""),
            (True, "True"),
            (False, "False"),
        ],
    )
    def test_reverse_coerce_to_str_works(self, value, expected):
        assert YesNoRadiosField.reverse_coerce_to_str(value) == expected

    def test_raises_value_error_on_unexpected_value(self):
        with pytest.raises(ValueError, match="Invalid YesNoRadiosField value: blah"):
            YesNoRadiosField.coerce("blah")


class TestOptionalUniqueEmailForm:
    def test_it_does_not_complain_about_existing_users_when_left_blank(self, db):
        UserFactory(email="")
        form = OptionalUniqueEmailForm(data={"email": ""})
        assert form.errors == {}

    def test_it_complains_about_existing_users_when_filled(self, db):
        UserFactory(email="boop@jones.com")
        form = OptionalUniqueEmailForm(data={"email": "boop@jones.com"})
        assert form.errors == {"email": ["A user with that email address already exists."]}

    def test_it_does_not_complain_when_existing_user_submits_their_own_email(self, db, rf):
        user = UserFactory(email="boop@jones.com")
        form = OptionalUniqueEmailForm(data={"email": "boop@jones.com"})
        req = rf.post("/")
        req.user = user
        form.set_request(req)
        assert form.errors == {}
