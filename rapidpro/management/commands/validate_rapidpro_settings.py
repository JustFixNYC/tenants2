from django.core.management.base import BaseCommand

from rapidpro.followup_campaigns import DjangoSettingsFollowupCampaigns
from .syncrapidpro import get_rapidpro_client


class Command(BaseCommand):
    help = "Validate all RapidPro settings with the RapidPro server."

    def handle(self, *args, **options):
        client = get_rapidpro_client()
        for name in DjangoSettingsFollowupCampaigns.get_names():
            campaign = DjangoSettingsFollowupCampaigns.get_campaign(name)
            if campaign is None:
                self.stdout.write(f"Follow-up campaign {name} is not configured.\n")
            else:
                self.stdout.write(f"Validating {name} {campaign}.\n")
                campaign.validate(client)
        self.stdout.write("Done.\n")
