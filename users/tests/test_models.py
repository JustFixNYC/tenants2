import pytest

from ..models import JustfixUser
from .factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory


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


def test_send_sms_does_nothing_if_user_has_no_onboarding_info(smsoutbox):
    user = JustfixUser(phone_number='5551234500')
    user.send_sms('hello there')
    assert len(smsoutbox) == 0


@pytest.mark.django_db
def test_send_sms_does_nothing_if_user_does_not_allow_it(smsoutbox):
    user = OnboardingInfoFactory(can_we_sms=False).user
    user.send_sms('hello there')
    assert len(smsoutbox) == 0


@pytest.mark.django_db
def test_send_sms_works_if_user_allows_it(smsoutbox):
    user = OnboardingInfoFactory(
        can_we_sms=True, user__phone_number='5551234500').user
    user.send_sms('hello there')
    assert len(smsoutbox) == 1
    assert smsoutbox[0].to == '+15551234500'
    assert smsoutbox[0].body == 'hello there'
