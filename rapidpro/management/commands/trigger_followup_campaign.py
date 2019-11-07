from typing import List
from django.core.management.base import CommandError, BaseCommand
from django.conf import settings
from temba_client.v2 import TembaClient

from users.models import validate_phone_number
from rapidpro.followup_campaigns import FollowupCampaign


CAMPAIGN_SETTING_PREFIX = "RAPIDPRO_FOLLOWUP_CAMPAIGN_"


def get_campaigns() -> List[str]:
    return [
        name[len(CAMPAIGN_SETTING_PREFIX):] for name in dir(settings)
        if name.startswith(CAMPAIGN_SETTING_PREFIX)
    ]


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('full_name')
        parser.add_argument('phone_number')
        parser.add_argument('campaign')

    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        full_name: str = options['full_name']
        phone_number: str = options['phone_number']
        campaign_name: str = options['campaign'].upper()
        campaigns = get_campaigns()

        validate_phone_number(phone_number)

        if campaign_name not in campaigns:
            raise CommandError(f"Please choose a valid follow-up campaign "
                               f"from: {', '.join(campaigns)}")

        setting_name = CAMPAIGN_SETTING_PREFIX + campaign_name
        campaign_str = getattr(settings, setting_name)
        campaign = FollowupCampaign.from_string(campaign_str)

        if campaign is None:
            raise CommandError(
                f"The {campaign_name} campaign must be configured via the "
                f"{setting_name} setting."
            )

        client = TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
        print(f"Validating {campaign}...")
        campaign.validate(client)

        print(f"Adding {full_name} ({phone_number}) to "
              f"{campaign_name} follow-up campaign...")
        campaign.add_contact(client, full_name, phone_number)
        print("Done.")
