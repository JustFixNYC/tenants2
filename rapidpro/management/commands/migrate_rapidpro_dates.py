import datetime
from typing import Iterable
import json
import gzip
import requests
from django.conf import settings
from django.core.management.base import CommandError, BaseCommand
from temba_client.v2 import TembaClient
from temba_client.serialization import TembaSerializationException
from temba_client.v2.types import Group, Field, Run, Contact
from temba_client.utils import format_iso8601

from project.justfix_environment import BASE_DIR


CACHE_DIR = BASE_DIR / '.rapidpro-cache'


def get_group(client: TembaClient, name: str) -> Group:
    group = client.get_groups(name=name).first(retry_on_rate_exceed=True)
    if group is None:
        raise ValueError(f"Unable to find RapidPro group '{name}'")
    return group


def get_field(client: TembaClient, key: str) -> Field:
    field = client.get_fields(key=key).first(retry_on_rate_exceed=True)
    if field is None:
        raise ValueError(f"Unable to find RapidPro field with key '{key}'")
    return field


def iter_archived_runs(client: TembaClient) -> Iterable[Run]:
    archives = client.get_archives(archive_type="run").iterfetches(retry_on_rate_exceed=True)
    for archive_batch in archives:
        for archive in archive_batch:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            filename = CACHE_DIR / f'{archive.hash}.jsonl.gz'
            if not filename.exists():
                print("Downloading", archive.download_url)
                res = requests.get(archive.download_url)
                res.raise_for_status()
                filename.write_bytes(res.content)
            content = gzip.decompress(filename.read_bytes()).decode('utf-8')
            for line in content.splitlines():
                item = json.loads(line)
                if 'start' not in item:
                    # This is an item not present in archived runs for some reason, so
                    # we'll just set a value to appease the deserializer.
                    item['start'] = {'uuid': 'this does not matter'}
                try:
                    run = Run.deserialize(item)
                except TembaSerializationException as e:
                    # There's a bug in this class that makes its str() not work, so
                    # we'll just print its arguments here.
                    print(f"TembaSerializationException: {e.args[0]}")
                    raise
                yield run


def get_run(client: TembaClient, contact: Contact, flow_uuid: str) -> Run:
    runs = client.get_runs(contact=contact).iterfetches(retry_on_rate_exceed=True)
    for run_batch in runs:
        for run in run_batch:
            if run.flow.uuid == flow_uuid:
                return run
    for run in iter_archived_runs(client):
        if run.contact.uuid == contact.uuid and run.flow.uuid == flow_uuid:
            return run
    raise ValueError(f"Unable to find RapidPro flow '{flow_uuid}' for contact '{contact.name}'")


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually update records",
                            action='store_true')

    def migrate_dates(self, client: TembaClient, group_name: str, field_key: str, flow_uuid: str,
                      dry_run: bool):
        group = get_group(client, group_name)
        assert get_field(client, field_key) is not None
        print(f"Setting {field_key} for all users in RapidPro group '{group_name}'.")
        contacts = client.get_contacts(group=group).iterfetches(retry_on_rate_exceed=True)
        for contact_batch in contacts:
            for contact in contact_batch:
                if not contact.fields[field_key]:
                    assert isinstance(contact.created_on, datetime.datetime)
                    run = get_run(client, contact, flow_uuid)
                    assert isinstance(run.exited_on, datetime.datetime)
                    if run.exited_on - contact.created_on > datetime.timedelta(days=2):
                        print(f"User {contact.name} joined on {contact.created_on} and was "
                              f"added to '{group_name}' on {run.exited_on}.")
                    update = {field_key: format_iso8601(run.exited_on)}
                    if dry_run:
                        print(f"DRY RUN, UPDATE {repr(contact.name)} FIELDS: {update}")
                    else:
                        client.update_contact(contact, fields={
                            **contact.fields,
                            **update
                        })

    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
        dry_run: bool = options['dry_run']

        self.migrate_dates(
            client,
            'LOC Sent Letter',
            'date_of_loc_sent_letter',
            '7f5fc188-8e6a-4fbb-bd55-ee85d38ffb08',  # 'LOC #1: Mailing Confirmation'
            dry_run
        )

        self.migrate_dates(
            client,
            'DHCR Requested Rental History',
            'date_of_dhcr_req_rental_history',
            '367fb415-29bd-4d98-8e42-40cba0dc8a97',  # 'DHCR flow'
            dry_run
        )
