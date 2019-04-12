import csv
from typing import Iterator, List, Any
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import connection

from project.util.streaming_csv import generate_csv_rows


MY_DIR = Path(__file__).parent.resolve()
USER_STATS_SQLFILE = MY_DIR / 'issuestats.sql'


def get_issue_stats_rows() -> Iterator[List[Any]]:
    with connection.cursor() as cursor:
        cursor.execute(USER_STATS_SQLFILE.read_text())
        yield from generate_csv_rows(cursor)


class Command(BaseCommand):
    help = 'Output a CSV of statistics about issues.'

    def handle(self, *args, **options):
        writer = csv.writer(self.stdout)
        for row in get_issue_stats_rows():
            writer.writerow(row)
