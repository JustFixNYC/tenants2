from typing import Dict
from django.conf import settings
from django.core.management.base import CommandError, BaseCommand

from users.models import JustfixUser
from project import airtable


class Command(BaseCommand):
    help = 'Synchronize with Airtable.'

    def handle(self, *args, **options):
        if not settings.AIRTABLE_API_KEY:
            raise CommandError("AIRTABLE_API_KEY must be configured.")

        self.stdout.write("Retrieving current Airtable...")
        records = airtable.get_record_dict()

        for user in JustfixUser.objects.all():
            our_fields = airtable.get_fields_for_user(user)
            record = records.get(user.pk)
            if record is None:
                self.stdout.write(f"{user} does not exist in Airtable, adding them.\n")
                airtable.create(our_fields)
            else:
                if record.fields_ == our_fields:
                    self.stdout.write(f"{user} is already synced.\n")
                else:
                    self.stdout.write(f"Updating {user}.\n")
                    airtable.update(record, our_fields)

        self.stdout.write("Finished synchronizing with Airtable!\n")
