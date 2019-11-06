import datetime
from django.conf import settings
from django.core.management.base import CommandError, BaseCommand
from temba_client.v2 import TembaClient
from temba_client.v2.types import Group, Field
from temba_client.utils import parse_iso8601


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


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('--only-contact-uuid', help="limit migration to one contact UUID")

    def find_contacts(self, client: TembaClient, group_name: str, field_key: str,
                      only_contact_uuid: str, date_diff: datetime.timedelta):
        group = get_group(client, group_name)
        assert get_field(client, field_key) is not None
        # print(f"Finding contacts in RapidPro group '{group_name}' whose {field_key} "
        #       f"exceeds their creation date by {date_diff}.")
        kwargs = {'group': group}
        if only_contact_uuid:
            kwargs['uuid'] = only_contact_uuid
        contacts = client.get_contacts(**kwargs).iterfetches(retry_on_rate_exceed=True)
        for contact_batch in contacts:
            for contact in contact_batch:
                field_value = parse_iso8601(contact.fields[field_key])
                assert isinstance(field_value, datetime.datetime)
                assert isinstance(contact.created_on, datetime.datetime)
                if field_value - contact.created_on > date_diff:
                    url = f"https://textit.in/contact/read/{contact.uuid}/"
                    print(f"{url},{group_name},{contact.created_on.date()},{field_value.date()}")

    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
        only_contact_uuid: str = options['only_contact_uuid'] or ""

        print("contact,group_name,created_on,date_added_to_group")

        self.find_contacts(
            client,
            'LOC Sent Letter',
            'date_of_loc_sent_letter',
            only_contact_uuid,
            datetime.timedelta(days=16)
        )

        self.find_contacts(
            client,
            'DHCR Requested Rental History',
            'date_of_dhcr_req_rental_history',
            only_contact_uuid,
            datetime.timedelta(days=19)
        )
