from django.core.management.base import CommandError, BaseCommand

from project.util.phone_number import validate_phone_number
from rapidpro.followup_campaigns import DjangoSettingsFollowupCampaigns
from .syncrapidpro import get_rapidpro_client


class Command(BaseCommand):
    help = "Put someone on a RapidPro follow-up campaign."

    def add_arguments(self, parser):
        parser.add_argument("full_legal_name")
        parser.add_argument("phone_number")
        parser.add_argument("campaign")
        parser.add_argument("locale")

    def handle(self, *args, **options):
        client = get_rapidpro_client()
        full_legal_name: str = options["full_legal_name"]
        phone_number: str = options["phone_number"]
        campaign_name: str = options["campaign"].upper()
        locale: str = options["locale"]
        campaigns = DjangoSettingsFollowupCampaigns.get_names()

        validate_phone_number(phone_number)

        if campaign_name not in campaigns:
            raise CommandError(
                f"Please choose a valid follow-up campaign " f"from: {', '.join(campaigns)}"
            )

        campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)

        if campaign is None:
            raise CommandError(
                f"The {campaign_name} campaign must be configured via the "
                f"{DjangoSettingsFollowupCampaigns.get_setting_name(campaign_name)} setting."
            )

        print(
            f"Adding {full_legal_name} ({phone_number}, {locale}) to "
            f"{campaign_name} follow-up campaign..."
        )
        campaign.add_contact(client, full_legal_name, phone_number, locale)
        print("Done.")
