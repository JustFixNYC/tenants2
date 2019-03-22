from unittest.mock import patch
from contextlib import contextmanager
import pytest

from texting.models import PhoneNumberLookup


@pytest.mark.parametrize('obj,expected', [
    [PhoneNumberLookup(), 'unknown'],
    [PhoneNumberLookup(is_valid=True), 'valid'],
    [PhoneNumberLookup(is_valid=False), 'invalid'],
])
def test_pnl_validity_str(obj, expected):
    assert obj.validity_str == expected


@pytest.mark.parametrize('obj,expected', [
    [PhoneNumberLookup(), ''],
    [PhoneNumberLookup(carrier={'type': 'mobile'}), 'mobile'],
])
def test_pnl_carrier_type(obj, expected):
    assert obj.carrier_type == expected


@pytest.mark.parametrize('obj,expected', [
    [PhoneNumberLookup(), 'unknown'],
    [PhoneNumberLookup(is_valid=False), 'invalid'],
    [PhoneNumberLookup(is_valid=True, carrier={'type': 'mobile'}), 'valid mobile'],
])
def test_pnl_adjectives(obj, expected):
    assert obj.adjectives == expected


@pytest.mark.parametrize('obj,expected', [
    [PhoneNumberLookup(), 'unknown phone number'],
    [PhoneNumberLookup(is_valid=False, phone_number='5551234567'),
     'invalid phone number 5551234567'],
])
def test_pnl_str(obj, expected):
    assert str(obj) == expected


class MockTwilioDbTest:
    @pytest.fixture(autouse=True)
    def setup_fixture(self, db):
        pass

    @contextmanager
    def mock_twilio(self, is_valid=None, carrier=None):
        with patch('texting.twilio.is_phone_number_valid', return_value=is_valid) as m1:
            self.is_phone_number_valid = m1
            with patch('texting.twilio.get_carrier_info', return_value=carrier) as m2:
                self.get_carrier_info = m2
                yield


class TestGetOrLookup(MockTwilioDbTest):
    def test_it_returns_new_saved_lookup_with_carrier_info_for_valid_numbers(self):
        with self.mock_twilio(is_valid=True, carrier={'type': 'mobile'}):
            lookup = PhoneNumberLookup.objects.get_or_lookup('5551234567')
            assert lookup is not None
            assert lookup.pk is not None
            assert lookup.is_valid is True
            assert lookup.carrier_type == 'mobile'
            self.is_phone_number_valid.assert_called_once_with('5551234567')
            self.get_carrier_info.assert_called_once_with('5551234567')

    def test_it_returns_new_saved_lookup_without_carrier_info_for_invalid_numbers(self):
        with self.mock_twilio(is_valid=False):
            lookup = PhoneNumberLookup.objects.get_or_lookup('5551234567')
            assert lookup is not None
            assert lookup.pk is not None
            assert lookup.is_valid is False
            assert lookup.carrier_type == ''
            self.is_phone_number_valid.assert_called_once_with('5551234567')
            self.get_carrier_info.assert_not_called()

    def test_it_returns_existing_lookup(self):
        lookup = PhoneNumberLookup(phone_number='5551234567', is_valid=True)
        lookup.save()
        with self.mock_twilio():
            assert PhoneNumberLookup.objects.get_or_lookup('5551234567') == lookup
            self.is_phone_number_valid.assert_not_called()
            self.get_carrier_info.assert_not_called()

    def test_it_returns_none_on_lookup_error(self):
        with self.mock_twilio(is_valid=None):
            assert PhoneNumberLookup.objects.get_or_lookup('5551234567') is None
            self.is_phone_number_valid.assert_called_once_with('5551234567')
            self.get_carrier_info.assert_not_called()
