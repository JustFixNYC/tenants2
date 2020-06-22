import hashlib
from enum import Enum
from typing import Dict
from django.conf import settings
from mailchimp3 import MailChimp
import requests

from project.util.settings_util import ensure_dependent_settings_are_nonempty


class Language(Enum):
    Spanish = 'es'
    English = 'en'


class SubscribeSource(Enum):
    WhoOwnsWhat = 'wow'
    OrgSite = 'orgsite'
    NoRent = 'norent'


SOURCE_LABELS: Dict[SubscribeSource, str] = {
    SubscribeSource.WhoOwnsWhat: 'Who Owns What',
    SubscribeSource.OrgSite: 'Org Site',
    SubscribeSource.NoRent: 'NoRent.org',
}


def get_tag_for_source(source: SubscribeSource) -> str:
    return f'Signup: {SOURCE_LABELS[source]}'


def get_client() -> MailChimp:
    headers = requests.utils.default_headers()
    headers['User-Agent'] = "JustFix.nyc Tenant Platform"
    return MailChimp(mc_api=settings.MAILCHIMP_API_KEY, request_headers=headers)


def get_email_hash(email: str):
    return hashlib.md5(email.lower().encode('ascii')).hexdigest()


def subscribe(email: str, language: Language, source: SubscribeSource):
    client = get_client()
    md5hash = get_email_hash(email)
    client.lists.members.create_or_update(settings.MAILCHIMP_LIST_ID, md5hash, {
        # https://api.mailchimp.com/schema/3.0/Lists/Members/Instance.json
        'email_address': email,
        'status_if_new': 'subscribed',
        'language': language.value,
    })
    client.lists.members.tags.update(settings.MAILCHIMP_LIST_ID, md5hash, {
        'tags': [{'name': get_tag_for_source(source), 'status': 'active'}],
    })


def is_enabled():
    return bool(settings.MAILCHIMP_API_KEY)


def validate_settings():
    ensure_dependent_settings_are_nonempty(
        'MAILCHIMP_API_KEY',
        'MAILCHIMP_LIST_ID',
    )
