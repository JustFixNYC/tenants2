from datetime import timedelta
from django.core.management import BaseCommand
from django.utils import timezone

from norent.models import Letter
from norent.letter_sending import send_letter


# We won't process letters that have been last updated this
# recently, to ensure that we're not processing it at the same time
# that the letter is being processed by our web server.
LAST_UPDATED_WINDOW = timedelta(hours=1)


def get_letters_to_process():
    return Letter.objects.filter(
        fully_processed_at__isnull=True, updated_at__lt=timezone.now() - LAST_UPDATED_WINDOW
    )


class Command(BaseCommand):
    help = "Process any NoRent.org letters that haven't yet been fully processed."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", help="don't actually process anything", action="store_true"
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]

        self.stdout.write("Processing NoRent.org letters that haven't been fully processed.\n")
        for letter in get_letters_to_process():
            print(f"Processing {letter} submitted on {letter.created_at}.")
            if not dry_run:
                send_letter(letter)
        self.stdout.write("Done.\n")
