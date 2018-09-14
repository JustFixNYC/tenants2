from ..models import JustfixUser


def test_str_works_when_only_phone_number_is_available():
    user = JustfixUser(phone_number='5551234567')
    assert str(user) == '5551234567'


def test_str_works_when_full_name_is_available():
    user = JustfixUser(phone_number='5551234567', full_name='boop jones')
    assert str(user) == '5551234567 (boop jones)'
