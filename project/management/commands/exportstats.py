import argparse
import textwrap
from django.core.management.base import BaseCommand
from django.utils.html import strip_tags

from project.admin_download_data import (
    DATA_DOWNLOADS,
    strict_get_data_download
)
from project.util.streaming_csv import generate_streaming_csv
from project.util.streaming_json import generate_streaming_json


class Command(BaseCommand):
    help = 'Output CSV or JSON data containing statistics.'

    def add_arguments(self, parser):
        parser.add_argument(
            'dataset',
            choices=[dd.slug for dd in DATA_DOWNLOADS],
            help='Dataset to export (see below for more details).'
        )
        parser.add_argument(
            '--format',
            choices=['csv', 'json'],
            default='csv',
            help='Format in which to output statistics (default: %(default)s)'
        )
        parser.formatter_class = argparse.RawDescriptionHelpFormatter
        parser.epilog = self.get_epilog()

    def get_epilog(self) -> str:
        lines = ["available datasets:\n"]
        for dd in DATA_DOWNLOADS:
            lines.append(f"  {dd.slug} - {dd.name}\n")
            desc = textwrap.dedent(strip_tags(dd.html_desc))
            desc = textwrap.fill(desc.strip(), width=66)
            lines.append(textwrap.indent(desc, "    "))
            lines.append("")
        return "\n".join(lines)

    def handle(self, *args, **options):
        dd = strict_get_data_download(options['dataset'])
        if options['format'] == 'csv':
            iterator = generate_streaming_csv(dd.generate_csv_rows())
        else:
            assert options['format'] == 'json'
            iterator = generate_streaming_json(dd.generate_json_rows())
        self.stdout.ending = ''
        for string in iterator:
            self.stdout.write(string)
