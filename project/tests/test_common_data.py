import pytest

from project.common_data import Choices


def test_get_label_works():
    choices = Choices(choices=[("FOO", "Foo"), ("BAR", "Bar")])
    assert choices.get_label("FOO") == "Foo"
    assert choices.get_label("BAR") == "Bar"


def test_get_enum_member_works():
    choices = Choices(choices=[("FOO", "Foo"), ("BAR", "Bar")])
    assert choices.get_enum_member("FOO") == choices.enum.FOO
    assert choices.get_enum_member("FOO").name == "FOO"
    assert choices.get_enum_member("FOO").value == "Foo"


def test_getattr_returns_choice_name():
    choices = Choices(choices=[("FOO", "Foo"), ("BAR", "Bar")])
    assert choices.FOO == "FOO"


def test_getattr_raises_err_on_invalid_choice_name():
    choices = Choices(choices=[("FOO", "Foo"), ("BAR", "Bar")])

    with pytest.raises(AttributeError, match="or valid choice"):
        choices.BOOOOP


def test_validate_choices_raises_no_err_on_valid_choices():
    choices = Choices(choices=[("FOO", "Foo"), ("BAR", "Bar")])

    choices.validate_choices("FOO")
    choices.validate_choices("BAR")
    choices.validate_choices("FOO", "BAR")


def test_validate_choices_raises_err_on_invalid_choice_name():
    choices = Choices(choices=[("FOO", "Foo"), ("BAR", "Bar")])

    with pytest.raises(ValueError, match="'BOOOOP' is not a valid choice"):
        choices.validate_choices("FOO", "BOOOOP")
