from django.core.management.base import BaseCommand, CommandError

from hpaction import docusign
from users.models import JustfixUser
from hpaction.models import HPActionDocuments
from project.util.site_util import absolute_reverse


class Command(BaseCommand):
    help = (
        'Create a signing request for an HP Action document.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The username to send an HP Action signing request for.'
        )

    def handle(self, *args, **options) -> None:
        docusign.ensure_valid_configuration()

        username = options['username']
        user = JustfixUser.objects.get(username=username)

        if not user.email:
            raise CommandError(f"user {username} has no email address!")

        docs = HPActionDocuments.objects.get_latest_for_user(user)

        if not docs:
            raise CommandError(f"user {username} has no HP Action documents to sign!")

        return_url = absolute_reverse('hpaction:docusign_callback')
        envelope_definition = docusign.create_envelope_definition_for_hpa(docs)
        api_client = docusign.create_default_api_client()
        _, url = docusign.create_envelope_and_recipient_view_for_hpa(
            user=user,
            envelope_definition=envelope_definition,
            api_client=api_client,
            return_url=return_url,
        )

        print(f"To sign, visit this URL within 5 minutes: {url}")
        print(f"When done, you will be redirected to {return_url}.")
