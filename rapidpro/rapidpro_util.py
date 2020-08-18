from typing import Optional
from django.conf import settings
from temba_client.v2 import TembaClient
from temba_client.v2.types import Group, Contact, Field


def iso639one2two(locale: str) -> str:
    '''
    Converts a two-letter ISO 639-1 language code (used by Django and all
    our code) to a three-letter ISO 639-2 language code (used by RapidPro).
    '''

    # https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
    ISO_639_ONE_TO_TWO = {
        "en": "eng",
        "es": "spa",
    }

    return ISO_639_ONE_TO_TWO[locale]


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


def get_or_create_contact(
    client: TembaClient,
    name: str,
    phone_number: str,
    locale: str
) -> Contact:
    '''
    Retrieve the contact with the given phone number, creating them (and providing the
    given name and locale) if they don't already exist.

    Locale should be an ISO 639-1 code, e.g. "en".
    '''

    urn = f'tel:+1{phone_number}'
    contact = client.get_contacts(urn=urn).first(retry_on_rate_exceed=True)
    if contact is None:
        contact = client.create_contact(name=name, urns=[urn], language=iso639one2two(locale))
    return contact


def get_client_from_settings() -> Optional[TembaClient]:
    '''
    Retrieve a RapidPro client based on Django settings, or None if
    RapidPro isn't configured.
    '''

    if not settings.RAPIDPRO_API_TOKEN:
        return None
    return TembaClient(settings.RAPIDPRO_HOSTNAME, settings.RAPIDPRO_API_TOKEN)
