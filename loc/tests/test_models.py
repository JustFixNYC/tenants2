from datetime import date, datetime
from django.core.exceptions import ValidationError

import pytest

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.models import AccessDate, LetterRequest, LandlordDetails
from .test_landlord_lookup import (
    mock_lookup_success, mock_lookup_failure, enable_fake_landlord_lookup)
from .factories import create_user_with_all_info


@pytest.mark.django_db
def test_set_for_user_works():
    user = UserFactory.create()
    AccessDate.objects.set_for_user(user, [date(2010, 1, 1)])
    assert AccessDate.objects.get_for_user(user) == [date(2010, 1, 1)]

    AccessDate.objects.set_for_user(user, [date(2011, 2, 2)])
    assert AccessDate.objects.get_for_user(user) == [date(2011, 2, 2)]


def test_letter_request_str_works_when_fields_are_not_set():
    info = LetterRequest()
    assert str(info) == 'LetterRequest object (None)'


def test_letter_request_str_works_when_fields_are_set():
    info = LetterRequest(user=UserFactory.build(), created_at=datetime(2018, 1, 2))
    assert str(info) == "Boop Jones's letter of complaint request from Tuesday, January 02 2018"


def test_landlord_details_address_lines_for_mailing_works():
    ld = LandlordDetails()
    assert ld.address_lines_for_mailing == []

    ld.address = '1 Cloud City\nBespin'
    assert ld.address_lines_for_mailing == ['1 Cloud City', 'Bespin']


class TestCreateLookupForUser:
    def test_returns_none_if_address_info_is_not_available(self):
        user = UserFactory.build()
        assert LandlordDetails.create_lookup_for_user(user) is None

    @pytest.mark.django_db
    @enable_fake_landlord_lookup
    def test_returns_empty_instance_if_lookup_fails(self, requests_mock):
        mock_lookup_failure(requests_mock)
        oi = OnboardingInfoFactory()
        info = LandlordDetails.create_lookup_for_user(oi.user)
        assert info.name == ''
        assert info.address == ''
        assert info.lookup_date is not None
        assert info.is_looked_up is False

    @pytest.mark.django_db
    @enable_fake_landlord_lookup
    def test_returns_filled_instance_if_lookup_succeeds(self, requests_mock):
        mock_lookup_success(requests_mock)
        oi = OnboardingInfoFactory()
        info = LandlordDetails.create_lookup_for_user(oi.user)
        assert info.name == 'BOBBY DENVER'
        assert info.address == "123 DOOMBRINGER STREET 4 11299"
        assert info.lookup_date is not None
        assert info.is_looked_up is True


class TestLetterRequestClean:
    @pytest.fixture(autouse=True)
    def setup(self, db):
        pass

    def make(self, user, mail_choice='WE_WILL_MAIL'):
        return LetterRequest(user=user, mail_choice=mail_choice)

    def test_it_works_when_user_has_all_info(self):
        self.make(create_user_with_all_info()).clean()

    def test_it_raises_error_when_no_landlord_info_exists(self):
        with pytest.raises(ValidationError, match='contact information for your landlord'):
            self.make(create_user_with_all_info(landlord=False)).clean()

    def test_it_raises_error_when_no_issues_exist(self):
        with pytest.raises(ValidationError, match='at least one issue'):
            self.make(create_user_with_all_info(issues=False)).clean()

    def test_it_raises_error_when_no_access_dates_exist(self):
        with pytest.raises(ValidationError, match='at least one access date'):
            self.make(create_user_with_all_info(access_dates=False)).clean()
