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
                print(f"Follow-up campaign {name} is not configured.")
            else:
                print(f"Validating {name} {campaign}.")
                campaign.validate(client)
        print("Done.")
