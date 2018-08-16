import json
from django.core.management.base import BaseCommand

from legacy_tenants.mongo import get_user_by_phone_number


class Command(BaseCommand):
    help = 'Show information about a legacy user.'

    def add_arguments(self, parser):
        parser.add_argument('phone_number')

    def handle(self, *args, **options):
        phone: str = options['phone_number']
        user = get_user_by_phone_number(phone)

        if user:
            self.stdout.write(json.dumps(user.dict(), indent=2, default=str))
        else:
            self.stdout.write(f"No user exists with phone # {phone}.\n")
