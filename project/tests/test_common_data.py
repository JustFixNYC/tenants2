from project.common_data import Choices


def test_get_label_works():
    choices = Choices(choices=[('FOO', 'Foo'), ('BAR', 'Bar')])
    assert choices.get_label('FOO') == 'Foo'
    assert choices.get_label('BAR') == 'Bar'
