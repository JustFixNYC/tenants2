from io import StringIO
from django.core.management import call_command, CommandError
import pytest

from .test_models import MockTwilioDbTest
from .test_twilio import apply_twilio_settings
from users.tests.factories import UserFactory
from texting.models import PhoneNumberLookup


class TestCommand(MockTwilioDbTest):
    def run_command(self):
        out = StringIO()
        call_command('syncphonenumberlookups', stdout=out)
        return out.getvalue().splitlines()

    def test_it_works(self, settings):
        apply_twilio_settings(settings)
        UserFactory(phone_number='5551234567', username='boop')
        UserFactory(phone_number='5551230000', username='blarg')
        lookup = PhoneNumberLookup(
            phone_number='5551234567', is_valid=True, carrier={'type': 'mobile'})
        lookup.save()

        with self.mock_twilio(is_valid=False):
            assert self.run_command() == [
                'Looking up phone number for blarg.',
                'Done syncing phone number lookups.'
            ]
            self.is_phone_number_valid.assert_called_once_with('5551230000')

        with self.mock_twilio():
            assert self.run_command() == [
                'Done syncing phone number lookups.'
            ]
            self.is_phone_number_valid.assert_not_called()


def test_it_raises_error_when_twilio_is_disabled():
    with pytest.raises(CommandError, match='Twilio integration is not enabled'):
        call_command('syncphonenumberlookups')
