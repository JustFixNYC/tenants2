from datetime import timedelta
from django.core.management import BaseCommand
from django.utils import timezone

from project.util.mailing_address import US_STATE_CHOICES
from evictionfree.models import SubmittedHardshipDeclaration
from evictionfree.declaration_sending import send_declaration


# We won't process declarations that have been last updated this
# recently, to ensure that we're not processing it at the same time
# that the declaration is being processed by our web server.
LAST_UPDATED_WINDOW = timedelta(hours=1)

# We might be running as part of a periodic job, and if we are, we don't want
# to have to process so many declarations that *another* instance of the
# job starts while we're still working. So by default, limit the number of
# declarations we process.
DEFAULT_MAX_DECLARATIONS = 50


def get_decls_to_process():
    not_too_recently = timezone.now() - LAST_UPDATED_WINDOW

    not_fully_processed = SubmittedHardshipDeclaration.objects.filter(
        fully_processed_at__isnull=True, updated_at__lt=not_too_recently
    )

    # We require addresses to be geocoded in order to send them to the
    # outside-NYC housing court, because we need to know their county.
    # In some cases, users may have onboarded while geocoding was
    # down, so when they originally sent their declaration, we may not
    # have sent it to housing court.  We may have then geocoded
    # their address at a later point, at which point we *can* send it
    # to their housing court.  The following queryset finds such cases.
    not_sent_to_housing_court = SubmittedHardshipDeclaration.objects.filter(
        fully_processed_at__isnull=False,
        updated_at__lt=not_too_recently,
        emailed_to_housing_court_at__isnull=True,
        user__onboarding_info__state=US_STATE_CHOICES.NY,
        user__onboarding_info__geocoded_point__isnull=False,
    )

    return not_fully_processed.union(not_sent_to_housing_court)


class Command(BaseCommand):
    help = (
        f"Process at most {DEFAULT_MAX_DECLARATIONS} (by default) EvictionFreeNY.org hardship "
        f"declarations that haven't yet been fully processed."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", help="don't actually process anything", action="store_true"
        )
        parser.add_argument(
            "--max",
            type=int,
            help=f"Maximum number of declarations to process (default: {DEFAULT_MAX_DECLARATIONS})",
            default=DEFAULT_MAX_DECLARATIONS,
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        max: int = options["max"]

        decls = get_decls_to_process()[:max]
        count = decls.count()
        self.stdout.write(
            f"Processing {count} hardship declarations that haven't been fully processed.\n"
        )
        for decl in decls:
            print(f"Processing {decl} submitted on {decl.created_at}.")
            if not dry_run:
                send_declaration(decl)
        self.stdout.write("Done.\n")
