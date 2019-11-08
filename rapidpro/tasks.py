from celery import shared_task

from .rapidpro_util import get_client_from_settings
from .followup_campaigns import DjangoSettingsFollowupCampaigns


@shared_task
def trigger_followup_campaign(full_name: str, phone_number: str, campaign_name: str):
    client = get_client_from_settings()
    campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)

    assert client is not None
    assert campaign is not None

    campaign.add_contact(client, full_name, phone_number)
