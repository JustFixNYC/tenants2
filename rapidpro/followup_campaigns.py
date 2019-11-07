import datetime
from typing import NamedTuple, Optional, List
from django.conf import settings
from temba_client.v2 import TembaClient
from temba_client.v2.types import Group, Contact, Field
from temba_client.utils import format_iso8601


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

        return [
            name[len(cls.CAMPAIGN_SETTING_PREFIX):] for name in dir(settings)
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

    def add_contact(self, client: TembaClient, full_name: str, phone_number: str):
        """
        Add the given contact to the follow-up campaign, creating a new RapidPro contact
        if needed.
        """

        contact = get_or_create_contact(client, full_name, phone_number)
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


def get_group(client: TembaClient, name: str) -> Group:
    '''
    Return the RapidPro group with the given name, raising an exception
    if it doesn't exist.
    '''

    group = client.get_groups(name=name).first(retry_on_rate_exceed=True)
    if group is None:
        raise ValueError(f"Unable to find RapidPro group '{name}'")
    return group


def get_field(client: TembaClient, key: str) -> Field:
    '''
    Return the RapidPro field with the given key, raising an exception
    if it doesn't exist.
    '''

    field = client.get_fields(key=key).first(retry_on_rate_exceed=True)
    if field is None:
        raise ValueError(f"Unable to find RapidPro field with key '{key}'")
    return field


def get_or_create_contact(client: TembaClient, name: str, phone_number: str) -> Contact:
    '''
    Retrieve the contact with the given phone number, creating them (and providing the
    given name) if they don't already exist.
    '''

    urn = f'tel:+1{phone_number}'
    contact = client.get_contacts(urn=urn).first(retry_on_rate_exceed=True)
    if contact is None:
        contact = client.create_contact(name=name, urns=[urn])
    return contact
