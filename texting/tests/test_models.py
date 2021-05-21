from typing import Any
from unittest.mock import patch
from contextlib import contextmanager
import pytest

from users.models import JustfixUser
from users.tests.factories import UserFactory
from texting.models import (
    PhoneNumberLookup,
    Reminder,
    REMINDERS,
    get_lookup_description_for_phone_number,
    exclude_users_with_invalid_phone_numbers,
)
from texting.twilio import SendSmsResult, TWILIO_BLOCKED_NUMBER_ERR, TWILIO_OTHER_ERR


@pytest.mark.parametrize(
    "obj,expected",
    [
        [PhoneNumberLookup(), "unknown"],
        [PhoneNumberLookup(is_valid=True), "valid"],
        [PhoneNumberLookup(is_valid=False), "invalid"],
    ],
)
def test_pnl_validity_str(obj, expected):
    assert obj.validity_str == expected


@pytest.mark.parametrize(
    "obj,expected",
    [
        [PhoneNumberLookup(), ""],
        [PhoneNumberLookup(carrier={"type": "mobile"}), "mobile"],
    ],
)
def test_pnl_carrier_type(obj, expected):
    assert obj.carrier_type == expected


@pytest.mark.parametrize(
    "obj,expected",
    [
        [PhoneNumberLookup(), "unknown"],
        [PhoneNumberLookup(is_valid=False), "invalid"],
        [PhoneNumberLookup(is_valid=True, carrier={"type": "mobile"}), "valid mobile"],
    ],
)
def test_pnl_adjectives(obj, expected):
    assert obj.adjectives == expected


@pytest.mark.parametrize(
    "obj,expected",
    [
        [PhoneNumberLookup(), "unknown phone number"],
        [
            PhoneNumberLookup(is_valid=False, phone_number="5551234567"),
            "invalid phone number 5551234567",
        ],
    ],
)
def test_pnl_str(obj, expected):
    assert str(obj) == expected


class MockTwilioDbTest:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db):
        pass

    @contextmanager
    def mock_twilio(self, is_valid=None, carrier=None):
        with patch("texting.twilio.is_phone_number_valid", return_value=is_valid) as m1:
            self.is_phone_number_valid = m1
            with patch("texting.twilio.get_carrier_info", return_value=carrier) as m2:
                self.get_carrier_info = m2
                yield


class TestInvalidate:
    def test_it_works_when_no_record_existed(self, db):
        lookup = PhoneNumberLookup.objects.invalidate("5551234567")
        assert lookup.pk
        assert lookup.is_valid is False
        assert lookup.carrier is None

    def test_it_modifies_existing_records(self, db):
        orig = PhoneNumberLookup(phone_number="5551234567", is_valid=True, carrier={"hi": 1})
        orig.save()
        lookup = PhoneNumberLookup.objects.invalidate("5551234567")
        assert lookup.pk == orig.pk
        assert lookup.is_valid is False
        assert lookup.carrier is None


class TestGetOrLookup(MockTwilioDbTest):
    def test_it_returns_new_saved_lookup_with_carrier_info_for_valid_numbers(self):
        with self.mock_twilio(is_valid=True, carrier={"type": "mobile"}):
            lookup = PhoneNumberLookup.objects.get_or_lookup("5551234567")
            assert lookup is not None
            assert lookup.pk is not None
            assert lookup.is_valid is True
            assert lookup.carrier_type == "mobile"
            self.is_phone_number_valid.assert_called_once_with("5551234567")
            self.get_carrier_info.assert_called_once_with("5551234567")

    def test_it_returns_new_saved_lookup_without_carrier_info_for_invalid_numbers(self):
        with self.mock_twilio(is_valid=False):
            lookup = PhoneNumberLookup.objects.get_or_lookup("5551234567")
            assert lookup is not None
            assert lookup.pk is not None
            assert lookup.is_valid is False
            assert lookup.carrier_type == ""
            self.is_phone_number_valid.assert_called_once_with("5551234567")
            self.get_carrier_info.assert_not_called()

    def test_it_returns_existing_lookup(self):
        lookup = PhoneNumberLookup(phone_number="5551234567", is_valid=True)
        lookup.save()
        with self.mock_twilio():
            assert PhoneNumberLookup.objects.get_or_lookup("5551234567") == lookup
            self.is_phone_number_valid.assert_not_called()
            self.get_carrier_info.assert_not_called()

    def test_it_returns_none_on_lookup_error(self):
        with self.mock_twilio(is_valid=None):
            assert PhoneNumberLookup.objects.get_or_lookup("5551234567") is None
            self.is_phone_number_valid.assert_called_once_with("5551234567")
            self.get_carrier_info.assert_not_called()


class TestGetLookupDescriptionForPhoneNumber(MockTwilioDbTest):
    NO_INFO = "No lookup details are available."

    def test_it_returns_no_info_on_empty_numbers(self):
        assert get_lookup_description_for_phone_number("") == self.NO_INFO

    def test_it_returns_no_info_when_lookup_fails(self):
        with self.mock_twilio():
            assert get_lookup_description_for_phone_number("5551234567") == self.NO_INFO

    def test_it_returns_info_when_lookup_succeeds(self):
        with self.mock_twilio(is_valid=False):
            assert (
                get_lookup_description_for_phone_number("5551234567")
                == "This appears to be an invalid phone number."
            )


class TestExcludeUsersWithInvalidPhoneNumbers:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db):
        self.phone_number = "5551234567"
        self.user = UserFactory(phone_number=self.phone_number)

    def get_users_with_valid_numbers(self):
        return exclude_users_with_invalid_phone_numbers(JustfixUser.objects.all())

    def test_users_are_not_excluded_when_no_lookup_exists(self):
        assert self.get_users_with_valid_numbers().count() == 1

    def test_users_are_not_excluded_when_lookup_indicates_valid_phone_number(self):
        PhoneNumberLookup(phone_number=self.phone_number, is_valid=True).save()
        assert self.get_users_with_valid_numbers().count() == 1

    def test_users_are_excluded_when_lookup_indicates_invalid_phone_number(self):
        PhoneNumberLookup(phone_number=self.phone_number, is_valid=False).save()
        assert self.get_users_with_valid_numbers().count() == 0


class TestTryToCreateFromSendSmsResult:
    def test_it_creates_reminder_when_sms_was_sent(self, db):
        user = UserFactory()
        result = Reminder.objects.try_to_create_from_send_sms_result(
            SendSmsResult("boop"), kind=REMINDERS.LOC, user=user
        )
        assert result and result.pk
        assert result.err_code is None
        assert result.kind == REMINDERS.LOC
        assert result.user == user

    def test_it_creates_reminder_when_sms_failed_and_should_not_be_retried(self, db):
        user = UserFactory()

        result = Reminder.objects.try_to_create_from_send_sms_result(
            SendSmsResult(err_code=TWILIO_BLOCKED_NUMBER_ERR), kind=REMINDERS.LOC, user=user
        )
        assert result and result.pk
        assert result.err_code == TWILIO_BLOCKED_NUMBER_ERR
        assert result.kind == REMINDERS.LOC
        assert result.user == user

    def test_it_does_nothing_when_when_sms_failed_and_should_be_retried(self):
        user: Any = "fake user that will not be used"
        result = Reminder.objects.try_to_create_from_send_sms_result(
            SendSmsResult(err_code=TWILIO_OTHER_ERR), kind=REMINDERS.LOC, user=user
        )
        assert result is None
