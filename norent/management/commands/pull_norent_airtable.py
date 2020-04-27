import urllib.parse
import json
from typing import Any, Dict, Iterator, List
from enum import Enum
from pathlib import Path
from django.core.management import BaseCommand, CommandError
from django.conf import settings

from project.common_data import COMMON_DATA_DIR
from airtable.api import Airtable, RawRow


MY_DIR = Path(__file__).parent.resolve()

BASE_URL = "https://api.airtable.com/v0"

# Hard-coding this ID isn't ideal, but we've got major time constraints
# and this is likely a temporary solution anyways (famous last words).
NORENT_VARIABLES_BASE_ID = "appcHw4ksitvRgc4y"

StateDict = Dict[str, Any]

BOOLEAN_YES_NO_FIELDS = [
    "Is documentation a legal requirement?",
    "Does the tenant need to send the documentation to the landlord?",
    "State without protections?",
]

TO_BE_USED_FIELD = 'toBeUsed'

IGNORE_FIELDS = [
    # Only some of our tables have an 'ID' column, for some reason, which we
    # don't actually need.
    "ID",
]

ARRAY_FIELDS = [
    ("textOfLegislation", 6),
]


class Table(Enum):
    STATE_LAW_FOR_BUILDER = "State Legislation for Letter Builder Screens"
    STATE_LAW_FOR_LETTER = "State Legislation for letter itself"
    STATE_PARTNERS_FOR_BUILDER = "State Partner Organizations for Letter Builder Screens"
    STATE_DOCUMENTATION_REQUIREMENTS = "Documentation Requirements"
    STATE_LEGAL_AID_PROVIDERS = "Local legal aid provider"


def to_camel_case(string: str) -> str:
    string = string.replace('-', ' ')
    cc = ''.join([
        word[0].upper() + word[1:]
        for word in string.split(' ')
    ])
    return cc[0].lower() + cc[1:]


def pop_if_present(fields: Dict[str, Any], key: str) -> Any:
    if key in fields:
        return fields.pop(key)
    return None


def convert_yes_no_to_boolean(name: str, value: str) -> bool:
    if value == "Yes":
        return True
    if value == "No":
        return False
    raise ValueError(f"Field '{name}' should be 'Yes' or 'No' but it is '{value}'!")


def filter_to_be_used(new_fields: Dict[str, Any]) -> Dict[str, Any]:
    if new_fields:
        to_be_used = new_fields.get(TO_BE_USED_FIELD, False)

        if to_be_used:
            new_fields.pop(TO_BE_USED_FIELD)
        else:
            new_fields = {}

    return new_fields


def transform_fields(fields: Dict[str, Any]) -> Dict[str, Any]:
    new_fields: Dict[str, Any] = {}

    for name, value in fields.items():
        if name in IGNORE_FIELDS:
            continue
        if name.lower().endswith('(not exposed)'):
            continue
        if name in BOOLEAN_YES_NO_FIELDS:
            value = convert_yes_no_to_boolean(name, value)
        new_name = to_camel_case(name).replace('?', '')
        new_fields[new_name] = value

    convert_all_numbered_fields_to_arrays(new_fields)

    return filter_to_be_used(new_fields)


def convert_all_numbered_fields_to_arrays(fields: Dict[str, Any]):
    for (prefix, max) in ARRAY_FIELDS:
        convert_numbered_fields_to_array(fields, prefix, max)


def convert_numbered_fields_to_array(
    fields: Dict[str, Any],
    prefix: str,
    max: int
):
    array: List[Any] = []
    for i in range(1, max + 1):
        key = f"{prefix}{i}"
        if key in fields:
            array.append(fields.pop(key))
    if array:
        fields[prefix] = array


def convert_rows_to_state_dict(table: Table, rows: Iterator[RawRow]) -> StateDict:
    '''
    Convert raw Airtable rows into a table that maps state codes
    to metadata about the states.
    '''

    states: StateDict = {}
    for row in rows:
        fields: Dict[str, Any] = row['fields']
        state = pop_if_present(fields, 'State')
        fields = transform_fields(fields)

        if state and fields:
            assert state not in states, f"{state} should only have one row"
            states[state] = fields
    return states


class Command(BaseCommand):
    def process_table(self, table: Table):
        print(f"Processing table \"{table.value}\".")
        url = f"{BASE_URL}/{NORENT_VARIABLES_BASE_ID}/{urllib.parse.quote(table.value)}"
        api = Airtable(
            url=url,
            api_key=settings.AIRTABLE_API_KEY,
        )
        rows = convert_rows_to_state_dict(table, api.list_raw())
        basename = table.name.lower().replace('_', '-')
        output_path = COMMON_DATA_DIR / f"norent-{basename}.json"
        print(f"Writing {output_path}.")

        json_blob = json.dumps(rows, indent='  ', sort_keys=True)

        # Prettier wants newlines at the end of JSON files, so we'll add it.
        json_blob = f"{json_blob}\n"

        output_path.write_text(json_blob)

    def handle(self, *args, **options):
        if not settings.AIRTABLE_API_KEY:
            raise CommandError("AIRTABLE_API_KEY must be configured.")

        for table in Table:
            self.process_table(table)
