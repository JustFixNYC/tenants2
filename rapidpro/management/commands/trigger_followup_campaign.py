from typing import List
from django.core.management.base import CommandError, BaseCommand
from django.conf import settings
from temba_client.v2 import TembaClient

from users.models import JustfixUser
from rapidpro.followup_campaigns import FollowupCampaign


CAMPAIGN_SETTING_PREFIX = "RAPIDPRO_FOLLOWUP_CAMPAIGN_"


def get_campaigns() -> List[str]:
    return [
        name[len(CAMPAIGN_SETTING_PREFIX):] for name in dir(settings)
        if name.startswith(CAMPAIGN_SETTING_PREFIX)
    ]


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('username')
        parser.add_argument('campaign')

    def handle(self, *args, **options):
        if not settings.RAPIDPRO_API_TOKEN:
            raise CommandError("RAPIDPRO_API_TOKEN must be configured.")
        username: str = options['username']
        campaign_name: str = options['campaign'].upper()
        campaigns = get_campaigns()

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

        user = JustfixUser.objects.get(username=username)

        print(f"Adding {user} to {campaign_name} follow-up campaign...")
        campaign.add_user(client, user)
        print("Done.")
