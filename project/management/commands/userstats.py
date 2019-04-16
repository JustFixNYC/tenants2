import csv
from typing import Iterator, List, Any
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import UNUSABLE_PASSWORD_PREFIX
from django.db import connection

from project.util.streaming_csv import generate_csv_rows


MY_DIR = Path(__file__).parent.resolve()
USER_STATS_SQLFILE = MY_DIR / 'userstats.sql'


def get_user_stats_rows(include_pad_bbl: bool = False) -> Iterator[List[Any]]:
    with connection.cursor() as cursor:
        cursor.execute(USER_STATS_SQLFILE.read_text(), {
            'include_pad_bbl': include_pad_bbl,
            'unusable_password_pattern': UNUSABLE_PASSWORD_PREFIX + '%'
        })
        yield from generate_csv_rows(cursor)


class Command(BaseCommand):
    help = 'Output a CSV of statistics about users.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--include-pad-bbl', action='store_true',
            help='Include potentially personally-identifiable "pad_bbl" column'
        )

    def handle(self, *args, **options):
        include_pad_bbl: bool = options['include_pad_bbl']
        writer = csv.writer(self.stdout)
        for row in get_user_stats_rows(include_pad_bbl=include_pad_bbl):
            writer.writerow(row)
