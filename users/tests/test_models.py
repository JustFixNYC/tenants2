from ..models import JustfixUser
from .factories import UserFactory


def test_formatted_phone_number_works():
    assert JustfixUser().formatted_phone_number() == ''

    user = JustfixUser(phone_number='5551234567')
    assert user.formatted_phone_number() == '(555) 123-4567'

    user = JustfixUser(phone_number='999999999999999999')
    assert user.formatted_phone_number() == '999999999999999999'


def test_str_works_when_only_phone_number_is_available():
    user = JustfixUser(phone_number='5551234567')
    assert str(user) == '5551234567'


def test_str_works_when_full_name_is_available():
    user = UserFactory.build(phone_number='5551234567', full_name='boop jones')
    assert str(user) == '5551234567 (boop jones)'


def test_full_name_only_renders_if_both_first_and_last_are_present():
    user = JustfixUser(first_name='Bobby', last_name='Denver')
    assert user.full_name == 'Bobby Denver'

    assert JustfixUser(first_name='Bobby').full_name == ''
    assert JustfixUser(last_name='Denver').full_name == ''
