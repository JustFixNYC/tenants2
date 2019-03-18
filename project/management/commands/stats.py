import csv
from typing import Iterator, List, Any
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import connection

MY_DIR = Path(__file__).parent.resolve()
STATS_SQLFILE = MY_DIR / 'stats.sql'


def get_user_stats_rows(include_pad_bbl: bool = False) -> Iterator[List[Any]]:
    with connection.cursor() as cursor:
        cursor.execute(STATS_SQLFILE.read_text(), {
            'include_pad_bbl': include_pad_bbl
        })
        yield [column.name for column in cursor.description]

        while True:
            row = cursor.fetchone()
            if row is None:
                break
            yield row


class Command(BaseCommand):
    help = 'Output a CSV of statistics about users.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--include-pad-bbl', action='store_true',
            help='Include "pad_bbl" (padded borough-block-lot) column')

    def handle(self, *args, **options):
        include_pad_bbl: bool = options['include_pad_bbl']
        writer = csv.writer(self.stdout)
        for row in get_user_stats_rows(include_pad_bbl=include_pad_bbl):
            writer.writerow(row)
