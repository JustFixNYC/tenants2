import os
import hashlib
import pprint
from django.core.management import BaseCommand
from mailchimp3 import MailChimp
import requests


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email')

    def handle(self, *args, **options):
        email: str = options['email']
        MAILCHIMP_API_KEY = os.environ['MAILCHIMP_API_KEY']
        MAILCHIMP_LISTID = os.environ['MAILCHIMP_LISTID']
        headers = requests.utils.default_headers()
        headers['User-Agent'] = "JustFix.nyc Tenant Platform"
        client = MailChimp(mc_api=MAILCHIMP_API_KEY, request_headers=headers)

        md5hash = hashlib.md5(email.lower().encode('ascii')).hexdigest()
        client.lists.members.create_or_update(MAILCHIMP_LISTID, md5hash, {
            # https://api.mailchimp.com/schema/3.0/Lists/Members/Instance.json
            'email_address': email,
            'status_if_new': 'subscribed',
            'language': 'es',
        })
        client.lists.members.tags.update(MAILCHIMP_LISTID, md5hash, {
            'tags': [{'name': 'blarf', 'status': 'active'}],
        })

        member = client.lists.members.get(MAILCHIMP_LISTID, md5hash)
        pprint.pprint(member)

        print("Done.")
