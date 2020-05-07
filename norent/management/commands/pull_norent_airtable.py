import urllib.parse
import json
import re
from typing import Any, Dict, List, NamedTuple, Optional, Iterable
from copy import deepcopy
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

LOCALIZED_FIELD_NAME_RE = re.compile(r"^(.+) \((English|Spanish)\)$")

LOCALIZED_FIELD_NAME_LOCALES = {
    'English': 'en',
    'Spanish': 'es',
}

LOCALES = LOCALIZED_FIELD_NAME_LOCALES.values()

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


class FieldName(NamedTuple):
    '''
    We parse the Airtable field name in various ways.

    Sometimes a field is "not exposed", which means that it shouldn't be
    exposed to our app at all and can therefore be ignored:

        >>> field = FieldName.parse("Notes (not exposed)")
        >>> field.is_not_exposed
        True

    Sometimes a field just has a name that we always want to ignore
    because they're in our module's `IGNORE_FIELDS` list:

        >>> field = FieldName.parse("ID")
        >>> field.should_ignore
        True

    We also camel case our field names and remove special characters
    to make them eaiser for our app's code to use:

        >>> field = FieldName.parse("Should we contact the user?")
        >>> field.camel_cased_name
        'shouldWeContactTheUser'

    Finally, some fields are localized...

        >>> field = FieldName.parse("Instructions (English)")
        >>> field.name
        'Instructions'
        >>> field.locale
        'en'

    ...while others aren't:

        >>> field = FieldName.parse("This field is not localized.")
        >>> field.name
        'This field is not localized.'
        >>> print(field.locale)
        None
    '''

    name: str
    locale: Optional[str]

    @classmethod
    def parse(cls, name: str) -> 'FieldName':
        locale = None
        match = LOCALIZED_FIELD_NAME_RE.match(name)
        if match:
            name = match[1]
            locale = LOCALIZED_FIELD_NAME_LOCALES[match[2]]
        return FieldName(name=name, locale=locale)

    @property
    def is_not_exposed(self) -> bool:
        return self.name.lower().endswith('(not exposed)')

    @property
    def should_ignore(self) -> bool:
        return (self.name in IGNORE_FIELDS) or self.is_not_exposed

    def matches_locale(self, locale: str) -> bool:
        if self.locale is None:
            return True
        return locale == self.locale

    @property
    def camel_cased_name(self) -> str:
        return to_camel_case(self.name).replace('?', '')


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


def transform_value(name: str, value: Any) -> Any:
    if name in BOOLEAN_YES_NO_FIELDS:
        value = convert_yes_no_to_boolean(name, value)
    if isinstance(value, str):
        value = value.strip()
    return value


def transform_fields(fields: Dict[str, Any], locale: str) -> Dict[str, Any]:
    new_fields: Dict[str, Any] = {}

    for name, value in fields.items():
        field = FieldName.parse(name)
        if field.should_ignore or not field.matches_locale(locale):
            continue
        new_name = field.camel_cased_name
        new_fields[new_name] = transform_value(field.name, value)

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


def convert_rows_to_state_dict(
    table: Table,
    rows: Iterable[RawRow],
    locale: str
) -> StateDict:
    '''
    Convert raw Airtable rows into a table that maps state codes
    to metadata about the states.
    '''

    # We're going to be destructively changing the rows, so make
    # a copy of them.
    rows = deepcopy(rows)

    states: StateDict = {}
    for row in rows:
        fields: Dict[str, Any] = row['fields']
        state = pop_if_present(fields, 'State')
        fields = transform_fields(fields, locale)

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
        basename = table.name.lower().replace('_', '-')
        raw_rows = list(api.list_raw())
        for locale in LOCALES:
            rows = convert_rows_to_state_dict(table, raw_rows, locale)
            output_path = COMMON_DATA_DIR / f"norent-{basename}-{locale}.json"
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
