from django.core.management.base import CommandError, BaseCommand
from django.conf import settings
from temba_client.v2 import TembaClient

from rapidpro.followup_campaigns import get_or_create_contact, FollowupCampaign


class Command(BaseCommand):
    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
        campaign = FollowupCampaign(group_name="Boop Group", field_key="date_of_boop")
        print(f"Validating {campaign}...")
        campaign.validate(client)

        name = "Jorf Jones"
        phone_number = "5551234500"
        print(f"Adding {name} ({phone_number}) to campaign...")
        contact = get_or_create_contact(client, name, phone_number)
        campaign.add_to_group_and_update_date_field(client, contact)
        print("Done.")
