from typing import Optional, Dict, Any

from celery import shared_task
from temba_client.exceptions import TembaHttpError

from .rapidpro_util import get_client_from_settings
from .followup_campaigns import DjangoSettingsFollowupCampaigns


# Note that *not* providing the `locale` argument to this task is DEPRECATED;
# it's really a required argument, but we're allowing it to be optional
# for a bit, because we might still need to process tasks added by old
# versions of the codebase which never supplied this argument.
@shared_task(bind=True, retry_backoff=True, default_retry_delay=30 * 60)
def trigger_followup_campaign(
    self,
    full_preferred_name: Optional[str],
    phone_number: str,
    campaign_name: str,
    locale: str = "en",
    custom_fields: Optional[Dict[str, Any]] = None,
):
    client = get_client_from_settings()
    campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)

    assert client is not None
    assert campaign is not None

    try:
        campaign.add_contact(
            client, full_preferred_name, phone_number, locale=locale, custom_fields=custom_fields
        )
    except TembaHttpError as e:
        raise self.retry(exc=e)
