from celery import shared_task
from temba_client.exceptions import TembaHttpError

from .rapidpro_util import get_client_from_settings
from .followup_campaigns import DjangoSettingsFollowupCampaigns


# Note that *not* providing the `locale` argument to this task is DEPRECATED;
# it's really a required argument, but we're allowing it to be optional
# for a bit, because we might still need to process tasks added by old
# versions of the codebase which never supplied this argument.
@shared_task(
    autoretry_for=(TembaHttpError,),
    retry_backoff=True,
    default_retry_delay=30 * 60
)
def trigger_followup_campaign(full_name: str, phone_number: str, campaign_name: str,
                              locale: str = 'en'):
    client = get_client_from_settings()
    campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)

    assert client is not None
    assert campaign is not None

    campaign.add_contact(client, full_name, phone_number, locale=locale)
