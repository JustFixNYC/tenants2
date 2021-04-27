from django.conf import settings
from django.core.management.base import CommandError, BaseCommand

from airtable.sync import AirtableSynchronizer, Airtable


class Command(BaseCommand):
    help = "Synchronize all users with Airtable, retrying if the rate " "limit is exceeded."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", help="don't actually change Airtable", action="store_true")

    def handle(self, *args, **options):
        verbosity = int(options["verbosity"])
        dry_run: bool = options["dry_run"]
        if not settings.AIRTABLE_URL:
            raise CommandError("AIRTABLE_URL must be configured.")

        self.stdout.write("Retrieving current Airtable...\n")
        syncer = AirtableSynchronizer(Airtable(max_retries=99), dry_run=dry_run)
        syncer.sync_users(stdout=self.stdout, verbose=verbosity >= 2)

        self.stdout.write("Finished synchronizing with Airtable!\n")
