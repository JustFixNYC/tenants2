from django.core.management.base import CommandError, BaseCommand
from django.conf import settings
from temba_client.v2 import TembaClient

from rapidpro.followup_campaigns import DjangoSettingsFollowupCampaigns


class Command(BaseCommand):
    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
        for name in DjangoSettingsFollowupCampaigns.get_names():
            campaign = DjangoSettingsFollowupCampaigns.get_campaign(name)
            if campaign is None:
                print(f"Follow-up campaign {name} is not configured.")
            else:
                print(f"Validating {name} {campaign}.")
                campaign.validate(client)
        print("Done.")
