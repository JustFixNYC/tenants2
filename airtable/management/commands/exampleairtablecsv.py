import csv
from django.core.management.base import BaseCommand

import airtable.record
from airtable.record import EXAMPLE_FIELDS


class Command(BaseCommand):
    help = (
        f"Print an example CSV file to stdout. This can then be imported "
        f"into Airtable, though you will still want to change the field "
        f"types as documented in {airtable.record.__file__}."
    )

    def handle(self, *args, **options):
        fieldnames = list(EXAMPLE_FIELDS.keys())
        writer = csv.DictWriter(self.stdout, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerow(EXAMPLE_FIELDS)
