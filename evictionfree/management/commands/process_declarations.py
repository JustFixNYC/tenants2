from datetime import timedelta
from django.core.management import BaseCommand
from django.utils import timezone

from evictionfree.models import SubmittedHardshipDeclaration
from evictionfree.declaration_sending import send_declaration


# We won't process declarations that have been last updated this
# recently, to ensure that we're not processing it at the same time
# that the declaration is being processed by our web server.
LAST_UPDATED_WINDOW = timedelta(hours=1)


def get_decls_to_process():
    return SubmittedHardshipDeclaration.objects.filter(
        fully_processed_at__isnull=True, updated_at__lt=timezone.now() - LAST_UPDATED_WINDOW
    )


class Command(BaseCommand):
    help = (
        "Process any EvictionFreeNY.org hardship declarations that haven't yet "
        "been fully processed."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", help="don't actually process anything", action="store_true"
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]

        self.stdout.write("Processing hardship declarations that haven't been fully processed.\n")
        for decl in get_decls_to_process():
            print(f"Processing {decl} submitted on {decl.created_at}.")
            if not dry_run:
                send_declaration(decl)
        self.stdout.write("Done.\n")
