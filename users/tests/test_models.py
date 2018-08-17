from ..models import JustfixUser


def test_str_works():
    user = JustfixUser(phone_number='5551234567')
    assert str(user) == '5551234567'
