import json
from django.core.management.base import BaseCommand

from legacy_tenants.mongo import get_user_by_phone_number, get_advocate_tenants


class Command(BaseCommand):
    help = 'Show information about the tenants of a legacy advocate.'

    def add_arguments(self, parser):
        parser.add_argument('phone_number')

    def handle(self, *args, **options):
        phone: str = options['phone_number']
        user = get_user_by_phone_number(phone)

        if user and user.advocate_info:
            for tenant in get_advocate_tenants(user.advocate_info):
                self.stdout.write(json.dumps(tenant.dict(), indent=2, default=str))
        else:
            self.stdout.write(f"No advocate exists with phone # {phone}.\n")
