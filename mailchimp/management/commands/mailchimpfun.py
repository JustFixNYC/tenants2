import pprint
from django.conf import settings
from django.core.management import BaseCommand

from mailchimp import mailchimp


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('email')

    def handle(self, *args, **options):
        email: str = options['email']

        mailchimp.subscribe(
            email=email,
            language=mailchimp.Language.Spanish,
            source=mailchimp.SubscribeSource.OrgSite,
        )

        client = mailchimp.get_client()
        md5hash = mailchimp.get_email_hash(email)
        member = client.lists.members.get(settings.MAILCHIMP_LIST_ID, md5hash)
        pprint.pprint(member)

        print("Done.")
