import pytest

from project.common_data import Choices


def test_get_label_works():
    choices = Choices(choices=[('FOO', 'Foo'), ('BAR', 'Bar')])
    assert choices.get_label('FOO') == 'Foo'
    assert choices.get_label('BAR') == 'Bar'


def test_get_enum_member_works():
    choices = Choices(choices=[('FOO', 'Foo'), ('BAR', 'Bar')])
    assert choices.get_enum_member('FOO') == choices.enum.FOO
    assert choices.get_enum_member('FOO').name == 'FOO'
    assert choices.get_enum_member('FOO').value == 'Foo'


def test_getattr_returns_choice_name():
    choices = Choices(choices=[('FOO', 'Foo'), ('BAR', 'Bar')])
    assert choices.FOO == 'FOO'


def test_getattr_raises_err_on_invalid_choice_name():
    choices = Choices(choices=[('FOO', 'Foo'), ('BAR', 'Bar')])

    with pytest.raises(AttributeError, match='or valid choice'):
        choices.BOOOOP
