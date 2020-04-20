import urllib.parse
import json
from enum import Enum
from pathlib import Path
from django.core.management import BaseCommand, CommandError
from django.conf import settings

from project.common_data import COMMON_DATA_DIR
from airtable.api import Airtable


MY_DIR = Path(__file__).parent.resolve()

BASE_URL = "https://api.airtable.com/v0"

# Hard-coding this ID isn't ideal, but we've got major time constraints
# and this is likely a temporary solution anyways (famous last words).
NORENT_VARIABLES_BASE_ID = "appcHw4ksitvRgc4y"


class Table(Enum):
    STATE_LAW_FOR_BUILDER = "State Legislation for Letter Builder Screens"
    STATE_LAW_FOR_LETTER = "State Legislation for letter itself"
    STATE_PARTNERS_FOR_BUILDER = "State Partner Organizations for Letter Builder Screens"
    DOCUMENTATION_REQUIREMENTS = "Documentation Requirements"


class Command(BaseCommand):
    def process_table(self, table: Table):
        print(f"Processing table \"{table.value}\".")
        url = f"{BASE_URL}/{NORENT_VARIABLES_BASE_ID}/{urllib.parse.quote(table.value)}"
        api = Airtable(
            url=url,
            api_key=settings.AIRTABLE_API_KEY,
        )
        rows = list(api.list_raw())
        basename = table.name.lower().replace('_', '-')
        output_path = COMMON_DATA_DIR / f"norent-{basename}.json"
        print(f"Writing {output_path}.")
        output_path.write_text(json.dumps(rows, indent="  "))

    def handle(self, *args, **options):
        if not settings.AIRTABLE_API_KEY:
            raise CommandError("AIRTABLE_API_KEY must be configured.")

        for table in Table:
            self.process_table(table)
