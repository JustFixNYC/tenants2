from django.conf import settings
from django.core.management.base import CommandError, BaseCommand

from users.models import JustfixUser
from project.airtable import Airtable


class Command(BaseCommand):
    help = 'Synchronize with Airtable.'

    def handle(self, *args, **options):
        if not settings.AIRTABLE_API_KEY:
            raise CommandError("AIRTABLE_API_KEY must be configured.")

        self.stdout.write("Retrieving current Airtable...")
        airtable = Airtable.from_settings()
        airtable.sync_users(JustfixUser.objects.all(), self.stdout)

        self.stdout.write("Finished synchronizing with Airtable!\n")
