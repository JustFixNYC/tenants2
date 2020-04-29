from django.conf import settings
from django.core.management.base import CommandError, BaseCommand

from airtable.sync import AirtableSynchronizer, Airtable


class Command(BaseCommand):
    help = (
        'Synchronize all users with Airtable, retrying if the rate '
        'limit is exceeded.'
    )

    def handle(self, *args, **options):
        verbosity = int(options['verbosity'])
        if not settings.AIRTABLE_URL:
            raise CommandError("AIRTABLE_URL must be configured.")

        self.stdout.write("Retrieving current Airtable...\n")
        syncer = AirtableSynchronizer(Airtable(max_retries=99))
        syncer.sync_users(stdout=self.stdout, verbose=verbosity >= 2)

        self.stdout.write("Finished synchronizing with Airtable!\n")
