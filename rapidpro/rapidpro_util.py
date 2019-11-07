from typing import Optional
from django.conf import settings
from temba_client.v2 import TembaClient
from temba_client.v2.types import Group, Contact, Field


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


def get_client_from_settings() -> Optional[TembaClient]:
    '''
    Retrieve a RapidPro client based on Django settings, or None if
    RapidPro isn't configured.
    '''

    if not settings.RAPIDPRO_API_TOKEN:
        return None
    return TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
