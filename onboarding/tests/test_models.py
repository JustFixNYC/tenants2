import datetime

from users.tests.factories import UserFactory
from onboarding.models import OnboardingInfo


def test_str_works_when_fields_are_not_set():
    info = OnboardingInfo()
    assert str(info) == 'OnboardingInfo object (None)'


def test_str_works_when_fields_are_set():
    info = OnboardingInfo(user=UserFactory.build(),
                          created_at=datetime.datetime(2018, 1, 2))
    assert str(info) == "Boop Jones's onboarding info from Tuesday, January 02 2018"


def test_borough_label_works():
    info = OnboardingInfo()
    assert info.borough_label == ''

    info.borough = 'STATEN_ISLAND'
    assert info.borough_label == 'Staten Island'


def test_full_address_works():
    info = OnboardingInfo()
    assert info.full_address == ''

    info.borough = 'STATEN_ISLAND'
    assert info.full_address == ''

    info.address = '123 Boop street'
    assert info.full_address == '123 Boop street, Staten Island'
