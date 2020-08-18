import datetime
from typing import NamedTuple, Optional, List
from django.conf import settings
from temba_client.v2 import TembaClient
from temba_client.v2.types import Contact
from temba_client.utils import format_iso8601

from .rapidpro_util import get_field, get_group, get_or_create_contact, get_client_from_settings


class DjangoSettingsFollowupCampaigns:
    '''
    RapidPro follow-up campaigns are defined by Django settings that start
    with the prefix "RAPIDPRO_FOLLOWUP_CAMPAIGN_".  This class provides
    tools for querying them.

    The name of a follow-up campaign is everything after the prefix, so
    e.g. the "BOOP" campaign is configured via the Django setting
    "RAPIDPRO_FOLLOWUP_CAMPAIGN_BOOP".
    '''

    CAMPAIGN_SETTING_PREFIX = "RAPIDPRO_FOLLOWUP_CAMPAIGN_"

    @classmethod
    def get_names(cls) -> List[str]:
        """
        Get the names of all follow-up campaigns defined in Django settings.
        """

        # Note that we're calling set() to ensure all the entries are unique;
        # For some reason, during test runs at least, there are liable to be
        # multiple entries for the same setting, which is super weird.
        settings_attrs = set(dir(settings))

        return [
            name[len(cls.CAMPAIGN_SETTING_PREFIX):] for name in settings_attrs
            if name.startswith(cls.CAMPAIGN_SETTING_PREFIX)
        ]

    @classmethod
    def get_setting_name(cls, name: str) -> str:
        """
        Get the full setting name of the given follow-up campaign, e.g.:

            >>> DjangoSettingsFollowupCampaigns.get_setting_name("BOOP")
            'RAPIDPRO_FOLLOWUP_CAMPAIGN_BOOP'
        """

        return cls.CAMPAIGN_SETTING_PREFIX + name

    @classmethod
    def get_campaign(cls, name: str) -> Optional['FollowupCampaign']:
        """
        Return the campaign with the given name, or None if it hasn't
        been configured.
        """

        campaign_str = getattr(settings, cls.get_setting_name(name))
        return FollowupCampaign.from_string(campaign_str)


class FollowupCampaign(NamedTuple):
    # The group name that the follow-up campaign is triggered on, e.g.
    # `LOC Sent Letter`.
    group_name: str

    # The date field key that events in the follow-up campaign are triggered
    # on. This should be the *key* of the field, not its label; the
    # key is how a field is referred to in a RapidPro template expression,
    # e.g. `date_of_loc_sent_letter`.
    field_key: str

    def validate(self, client: TembaClient):
        """
        Ensure that the followup campaign's group name and field key exist,
        raising an exception if they don't.
        """

        get_group(client, self.group_name)
        get_field(client, self.field_key)

    def add_to_group_and_update_date_field(self, client: TembaClient, contact: Contact):
        """
        Add the given contact to the follow-up campaign's group, setting the campaign's
        field key to the current date and time.
        """

        client.update_contact(
            contact,
            groups=[*contact.groups, get_group(client, self.group_name)],
            fields={
                **contact.fields,
                self.field_key: format_iso8601(datetime.datetime.now())
            }
        )

    def add_contact(self, client: TembaClient, full_name: str, phone_number: str, locale: str):
        """
        Add the given contact to the follow-up campaign, creating a new RapidPro contact
        if needed.

        Locale should be an ISO 639-1 code, e.g. "en".
        """

        contact = get_or_create_contact(client, full_name, phone_number, locale=locale)
        self.add_to_group_and_update_date_field(client, contact)

    @classmethod
    def from_string(cls, value: str) -> Optional['FollowupCampaign']:
        """
        Get a follow-up campaign from a single string value, e.g.:

            >>> FollowupCampaign.from_string("Boop Group,date_of_boop")
            FollowupCampaign(group_name='Boop Group', field_key='date_of_boop')

        Note that if an empty string is passed in, this will return None, e.g.:

            >>> FollowupCampaign.from_string("")
        """

        if not value:
            return None
        return FollowupCampaign(*value.split(',', 1))


def trigger_followup_campaign_async(
    full_name: str,
    phone_number: str,
    campaign_name: str,
    locale: str
):
    '''
    Add the given contact to the given follow-up campaign from Django settings, e.g.:

        >>> trigger_followup_campaign_async("Boop Jones", "5551234567", "RH", "en")

    If RapidPro or the follow-up campaign isn't configured, nothing is done.
    '''

    client = get_client_from_settings()
    campaign = DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)
    if client and campaign:
        from . import tasks
        tasks.trigger_followup_campaign_v2.delay(full_name, phone_number, campaign_name, locale)


def ensure_followup_campaign_exists(campaign_name: str) -> None:
    '''
    Raises an exception if the given follow-up campaign name doesn't exist, e.g.:

        >>> ensure_followup_campaign_exists('BOOP')
        Traceback (most recent call last):
        ...
        AttributeError: 'Settings' object has no attribute 'RAPIDPRO_FOLLOWUP_CAMPAIGN_BOOP'

    Note that this will *not* raise anything if the campaign exists but
    has not been configured.
    '''

    DjangoSettingsFollowupCampaigns.get_campaign(campaign_name)
