import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import connection

MY_DIR = Path(__file__).parent.resolve()
STATS_SQLFILE = MY_DIR / 'stats.sql'


class Command(BaseCommand):
    help = 'Output a CSV of statistics about users.'

    def handle(self, *args, **options):
        writer = csv.writer(self.stdout)
        with connection.cursor() as cursor:
            cursor.execute(STATS_SQLFILE.read_text())
            writer.writerow(column.name for column in cursor.description)
            row = cursor.fetchone()
            writer.writerow(row)
