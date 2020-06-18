import hashlib
from enum import Enum
from django.conf import settings
from mailchimp3 import MailChimp
import requests


class Language(Enum):
    Spanish = 'es'
    English = 'en'


class SubscribeSource(Enum):
    WhoOwnsWhat = 'wow'
    OrgSite = 'orgsite'


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
    tag = f'source:{source.value}'
    client.lists.members.tags.update(settings.MAILCHIMP_LIST_ID, md5hash, {
        'tags': [{'name': tag, 'status': 'active'}],
    })
