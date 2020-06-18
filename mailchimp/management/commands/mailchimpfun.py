import hashlib
import pprint
from django.core.management import BaseCommand
from django.conf import settings
from mailchimp3 import MailChimp
import requests


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email')

    def handle(self, *args, **options):
        email: str = options['email']
        headers = requests.utils.default_headers()
        headers['User-Agent'] = "JustFix.nyc Tenant Platform"
        client = MailChimp(mc_api=settings.MAILCHIMP_API_KEY, request_headers=headers)

        md5hash = hashlib.md5(email.lower().encode('ascii')).hexdigest()
        client.lists.members.create_or_update(settings.MAILCHIMP_LIST_ID, md5hash, {
            # https://api.mailchimp.com/schema/3.0/Lists/Members/Instance.json
            'email_address': email,
            'status_if_new': 'subscribed',
            'language': 'es',
        })
        client.lists.members.tags.update(settings.MAILCHIMP_LIST_ID, md5hash, {
            'tags': [{'name': 'blarf', 'status': 'active'}],
        })

        member = client.lists.members.get(settings.MAILCHIMP_LIST_ID, md5hash)
        pprint.pprint(member)

        print("Done.")
