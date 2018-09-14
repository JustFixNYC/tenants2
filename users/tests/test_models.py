from ..models import JustfixUser


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
    user = JustfixUser(phone_number='5551234567', full_name='boop jones')
    assert str(user) == '5551234567 (boop jones)'
