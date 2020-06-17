import os
from django.core.management import BaseCommand
from mailchimp3 import MailChimp


class Command(BaseCommand):
    def handle(self, *args, **options):
        MAILCHIMP_API_KEY = os.environ['MAILCHIMP_API_KEY']
        MAILCHIMP_LISTID = os.environ['MAILCHIMP_LISTID']
        client = MailChimp(mc_api=MAILCHIMP_API_KEY)

        # https://api.mailchimp.com/schema/3.0/Lists/Members/Instance.json
        client.lists.members.create(MAILCHIMP_LISTID, {
            'email_address': 'foo@example.com',
            'status': 'subscribed',
            'tags': ['Who Owns What'],
            'language': 'es',
        })

#        oof = client.lists.members.all(MAILCHIMP_LISTID)
#        import pprint
#        pprint.pprint(oof['members'])
        print("Done.")
