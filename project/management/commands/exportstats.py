from typing import Optional
import argparse
import textwrap
from django.core.management.base import BaseCommand
from django.utils.html import strip_tags
from django.contrib.auth.models import AnonymousUser

from users.models import JustfixUser
from project.admin_download_data import get_all_data_downloads, strict_get_data_download
from project.util.streaming_csv import generate_streaming_csv
from project.util.streaming_json import generate_streaming_json


class Command(BaseCommand):
    help = "Output CSV or JSON data containing statistics."

    def add_arguments(self, parser):
        parser.add_argument(
            "dataset",
            choices=[dd.slug for dd in get_all_data_downloads()],
            help="Dataset to export (see below for more details).",
        )
        parser.add_argument(
            "--format",
            choices=["csv", "json"],
            default="csv",
            help="Format in which to output statistics (default: %(default)s)",
        )
        parser.add_argument("--user", help="Username to make the export the dataset as.")
        parser.formatter_class = argparse.RawDescriptionHelpFormatter
        parser.epilog = self.get_epilog()

    def get_epilog(self) -> str:
        lines = ["available datasets:\n"]
        for dd in get_all_data_downloads():
            lines.append(f"  {dd.slug} - {dd.name}\n")
            desc = textwrap.dedent(strip_tags(dd.html_desc))
            desc = textwrap.fill(desc.strip(), width=66)
            lines.append(textwrap.indent(desc, "    "))
            lines.append("")
        return "\n".join(lines)

    def handle(self, *args, **options):
        username: Optional[str] = options["user"]
        user = JustfixUser.objects.get(username=username) if username else AnonymousUser()
        dd = strict_get_data_download(options["dataset"])
        if options["format"] == "csv":
            iterator = generate_streaming_csv(dd.generate_csv_rows(user))
        else:
            assert options["format"] == "json"
            iterator = generate_streaming_json(dd.generate_json_rows(user))
        self.stdout.ending = ""
        for string in iterator:
            self.stdout.write(string)
