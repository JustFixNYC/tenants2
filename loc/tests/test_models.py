from datetime import date, datetime
from django.utils import timezone
from django.core.exceptions import ValidationError

import pytest

from users.tests.factories import UserFactory
from onboarding.tests.factories import OnboardingInfoFactory
from loc.models import (
    AddressDetails,
    AccessDate,
    LetterRequest,
    LandlordDetails,
    LOC_MAILING_CHOICES,
)
from .test_landlord_lookup import (
    mock_lookup_success,
    mock_lookup_failure,
    enable_fake_landlord_lookup,
)
from .factories import create_user_with_all_info, LetterRequestFactory, LandlordDetailsV2Factory

WE_WILL_MAIL = LOC_MAILING_CHOICES.WE_WILL_MAIL
USER_WILL_MAIL = LOC_MAILING_CHOICES.USER_WILL_MAIL


@pytest.mark.django_db
def test_set_for_user_works():
    user = UserFactory.create()
    AccessDate.objects.set_for_user(user, [date(2010, 1, 1)])
    assert AccessDate.objects.get_for_user(user) == [date(2010, 1, 1)]

    AccessDate.objects.set_for_user(user, [date(2011, 2, 2)])
    assert AccessDate.objects.get_for_user(user) == [date(2011, 2, 2)]


def test_letter_request_str_works_when_fields_are_not_set():
    info = LetterRequest()
    assert str(info) == "LetterRequest object (None)"


def test_letter_request_str_works_when_fields_are_set():
    info = LetterRequest(user=UserFactory.build(), created_at=datetime(2018, 1, 2))
    assert str(info) == "Boop Jones's letter of complaint request from Tuesday, January 02 2018"


def test_landlord_details_address_lines_for_mailing_works():
    ld = LandlordDetails()
    assert ld.address_lines_for_mailing == []

    ld.address = "1 Cloud City\nBespin"
    assert ld.address_lines_for_mailing == ["1 Cloud City", "Bespin"]

    # Ensure it prefers granular details.
    ld.primary_line = "1 Cloud City"
    ld.city = "Bespin"
    ld.state = "OH"
    ld.zip_code = "43220"
    assert ld.address_lines_for_mailing == [
        "1 Cloud City",
        "Bespin, OH 43220",
    ]


def test_landlord_details_legacy_address_is_updated_on_save(db):
    ld = LandlordDetailsV2Factory()
    assert ld.address == "123 Cloud City Drive\nBespin, NY 12345"
    ld.zip_code = "12000"
    ld.save()
    ld.refresh_from_db()
    assert ld.address == "123 Cloud City Drive\nBespin, NY 12000"


def test_landlord_details_clear_address_works():
    ld = LandlordDetailsV2Factory.build()
    assert ld.address != ""
    assert ld.primary_line != ""
    ld.clear_address()
    assert ld.address == ""
    assert ld.primary_line == ""


def test_landlord_details_formatted_phone_number_works():
    assert LandlordDetails().formatted_phone_number() == ""
    assert LandlordDetails(phone_number="5551234567").formatted_phone_number() == "(555) 123-4567"


class TestCreateOrUpdateLookupForUser:
    def test_returns_none_if_address_info_is_not_available(self):
        user = UserFactory.build()
        assert LandlordDetails.create_or_update_lookup_for_user(user) is None

    @pytest.mark.django_db
    @enable_fake_landlord_lookup
    def test_returns_empty_instance_if_lookup_fails(self, requests_mock):
        mock_lookup_failure(requests_mock)
        oi = OnboardingInfoFactory()
        info = LandlordDetails.create_or_update_lookup_for_user(oi.user)
        assert info.name == ""
        assert info.address == ""
        assert info.lookup_date is not None
        assert info.is_looked_up is False

    @pytest.mark.django_db
    @enable_fake_landlord_lookup
    def test_it_updates_existing_ll_details(self, requests_mock, nycdb):
        ld = LandlordDetailsV2Factory()
        assert ld.name == "Landlordo Calrissian"
        mock_lookup_success(requests_mock, nycdb)
        OnboardingInfoFactory(user=ld.user)
        info = LandlordDetails.create_or_update_lookup_for_user(ld.user)
        assert info.pk == ld.pk
        ld.refresh_from_db()
        assert ld.name == "BOOP JONES"

    @pytest.mark.django_db
    @enable_fake_landlord_lookup
    def test_returns_filled_instance_if_lookup_succeeds(self, requests_mock, nycdb):
        mock_lookup_success(requests_mock, nycdb)
        oi = OnboardingInfoFactory()
        info = LandlordDetails.create_or_update_lookup_for_user(oi.user)
        assert info.name == "BOOP JONES"
        assert info.address == "124 99TH STREET\nBrooklyn, NY 11999"
        assert info.primary_line == "124 99TH STREET"
        assert info.city == "Brooklyn"
        assert info.state == "NY"
        assert info.zip_code == "11999"
        assert info.lookup_date is not None
        assert info.is_looked_up is True


class TestCanChangeContent:
    def test_it_is_true_for_instances_without_created_at(self):
        assert LetterRequest(html_content="boop").can_change_content() is True

    def test_it_is_false_when_it_has_been_mailed_via_lob(self):
        assert (
            LetterRequest(
                html_content="boop",
                lob_letter_object={"blah": 1},
            ).can_change_content()
            is False
        )

    def test_it_is_false_when_it_has_been_mailed_manually(self):
        assert (
            LetterRequest(html_content="boop", tracking_number="1234").can_change_content() is False
        )

    def test_it_is_true_when_within_leeway_window(self):
        assert (
            LetterRequest(created_at=timezone.now(), html_content="boop").can_change_content()
            is True
        )

    def test_it_is_false_when_outside_leeway_window(self):
        assert (
            LetterRequest(
                created_at=timezone.make_aware(datetime(2001, 1, 1)), html_content="boop"
            ).can_change_content()
            is False
        )


class TestLetterRequestClean:
    Y2K = timezone.make_aware(datetime(2000, 1, 1))

    @pytest.fixture(autouse=True)
    def setup(self, db):
        pass

    def make(self, user, mail_choice=WE_WILL_MAIL, **kwargs):
        return LetterRequest(user=user, mail_choice=mail_choice, **kwargs)

    def make_ancient(self, mail_choice=WE_WILL_MAIL, **kwargs):
        lr = self.make(
            create_user_with_all_info(), mail_choice=mail_choice, html_content="blorp", **kwargs
        )
        lr.save()
        lr.created_at = self.Y2K
        lr.save()
        return lr

    def test_it_works_when_user_has_all_info(self):
        self.make(create_user_with_all_info()).clean()

    def test_it_raises_error_when_no_landlord_info_exists(self):
        with pytest.raises(ValidationError, match="contact information for your landlord"):
            self.make(create_user_with_all_info(landlord=False)).clean()

    def test_it_raises_error_when_no_issues_exist(self):
        with pytest.raises(ValidationError, match="at least one issue"):
            self.make(create_user_with_all_info(issues=False)).clean()

    def test_it_raises_error_when_no_access_dates_exist(self):
        with pytest.raises(ValidationError, match="at least one access date"):
            self.make(create_user_with_all_info(access_dates=False)).clean()

    def test_it_raises_error_when_letter_is_rejected_and_mailed(self):
        with pytest.raises(ValidationError, match="both rejected and mailed"):
            self.make(UserFactory(), rejection_reason="blah", tracking_number="123").clean()

    def test_it_works_when_nothing_has_changed(self):
        lr = self.make_ancient()
        lr.clean()

    def test_it_raises_error_when_content_cannot_be_changed(self):
        lr = self.make_ancient()
        lr.html_content = "blap"
        with pytest.raises(ValidationError, match="already being mailed"):
            lr.clean()

    def test_user_can_switch_to_we_will_mail(self):
        lr = self.make_ancient(mail_choice=USER_WILL_MAIL)
        lr.mail_choice = WE_WILL_MAIL
        lr.clean()

    def test_user_cannot_switch_from_we_will_mail(self):
        lr = self.make_ancient()
        lr.mail_choice = USER_WILL_MAIL
        with pytest.raises(ValidationError, match="already being mailed"):
            lr.clean()

    def test_tracker_resets_on_save(self):
        lr = self.make_ancient()
        lr.mail_choice = USER_WILL_MAIL
        lr.save()
        lr.clean()


class TestAddressDetails:
    def test_as_lob_params_returns_address_string_when_not_populated(self):
        ad = AddressDetails(address="150 Court St. #2\nBrooklyn, NY 11201")
        assert ad.as_lob_params() == {"address": "150 Court St. #2\nBrooklyn, NY 11201"}

    def test_as_lob_params_returns_fields_when_populated(self):
        kwargs = dict(
            primary_line="150 Court St. #2", city="Brooklyn", state="NY", zip_code="11201"
        )
        ad = AddressDetails(**kwargs)
        assert ad.as_lob_params() == kwargs

    def test_str_works(self):
        assert str(AddressDetails(address="hi\nthere")) == "hi / there"


class TestUspsTrackingUrl:
    def test_it_is_empty_if_tracking_number_not_set(self):
        assert LetterRequest().usps_tracking_url == ""

    def test_it_is_nonempty_if_tracking_number_set(self):
        url = "https://tools.usps.com/go/TrackConfirmAction?tLabels=1234"
        assert LetterRequest(tracking_number="1234").usps_tracking_url == url


class TestTrackingNumberChanged:
    def make(self, **kwargs):
        onb = OnboardingInfoFactory()
        return LetterRequestFactory(user=onb.user, **kwargs)

    def test_nothing_is_done_when_cleared(self, db, smsoutbox):
        lr = self.make(tracking_number="1234")
        lr.tracking_number = ""
        lr.save()
        assert len(smsoutbox) == 0

    def test_message_sent_when_set(self, db, smsoutbox):
        lr = self.make()
        lr.tracking_number = "1234"
        lr.save()
        messages_sent = len(smsoutbox)
        assert messages_sent > 0

        # Make sure we don't send *again* when saving again.
        lr.save()
        assert len(smsoutbox) == messages_sent
