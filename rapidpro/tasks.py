from celery import shared_task

from .rapidpro_util import get_client_from_settings
from .followup_campaigns import DjangoSettingsFollowupCampaigns


# This endpoint is DEPRECATED and should no longer be used. We're keeping
# it around for a bit, though, because we use Heroku Preboot [1] in production and
# we might still need to processing tasks added by old versions of the codebase.
@shared_task
def trigger_followup_campaign(
    full_name: str,
    phone_number: str,
    campaign_name: str
):  # pragma: no cover
    client = get_client_from_settings()
    campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)

    assert client is not None
    assert campaign is not None

    campaign.add_contact(client, full_name, phone_number, locale="en")


@shared_task
def trigger_followup_campaign_v2(full_name: str, phone_number: str, campaign_name: str,
                                 locale: str):
    client = get_client_from_settings()
    campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)

    assert client is not None
    assert campaign is not None

    campaign.add_contact(client, full_name, phone_number, locale=locale)
