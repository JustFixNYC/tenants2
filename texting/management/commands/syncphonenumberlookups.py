from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.db.models import Exists, OuterRef

from users.models import JustfixUser
from texting.models import PhoneNumberLookup


def verify_twilio_is_enabled():
    if not settings.TWILIO_ACCOUNT_SID:
        raise CommandError("Twilio integration is not enabled!")


def find_users_without_lookups():
    """
    Return a QuerySet of users that we don't have phone number lookups for.
    """

    lookups = PhoneNumberLookup.objects.filter(phone_number=OuterRef("phone_number"))
    return JustfixUser.objects.annotate(is_phone_number_looked_up=Exists(lookups)).exclude(
        is_phone_number_looked_up=True
    )


class Command(BaseCommand):
    help = "Find information about user phone numbers via the Twilio Lookup API."

    def handle(self, *args, **options):
        verify_twilio_is_enabled()
        users = find_users_without_lookups()
        for user in users:
            self.stdout.write(f"Looking up phone number for {user}.\n")
            PhoneNumberLookup.objects.get_or_lookup(user.phone_number)
        self.stdout.write(f"Done syncing phone number lookups.\n")
