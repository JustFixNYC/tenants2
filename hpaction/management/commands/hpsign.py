import os
from django.core.management.base import BaseCommand, CommandError

from hpaction import docusign
from users.models import JustfixUser
from hpaction.models import HPActionDocuments
from project.util.site_util import absolutify_url


ACCESS_TOKEN_ARG_VAR = 'access-token'

ACCESS_TOKEN_ARG = f"--{ACCESS_TOKEN_ARG_VAR}"

ACCESS_TOKEN_ENV = 'DOCUSIGN_ACCESS_TOKEN'

ACCESS_TOKEN_URL = 'https://developers.docusign.com/oauth-token-generator'


class Command(BaseCommand):
    help = (
        'Create a signing request for an HP Action document.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            help='The username to send an HP Action signing request for.'
        )
        parser.add_argument(
            ACCESS_TOKEN_ARG,
            help=(
                "The OAuth access token to use. To get one, visit "
                f"{ACCESS_TOKEN_URL}. Alternatively, set "
                f"the {ACCESS_TOKEN_ENV} environment variable."
            )
        )

    def handle(self, *args, **options) -> None:
        docusign.ensure_valid_configuration()

        access_token = options.get(ACCESS_TOKEN_ARG_VAR) or os.environ.get(ACCESS_TOKEN_ENV)
        if not access_token:
            raise CommandError(
                f'Please define your OAuth access token using the {ACCESS_TOKEN_ARG} argument '
                f'or set the {ACCESS_TOKEN_ENV} environment variable. You can get an access '
                f'token at {ACCESS_TOKEN_URL}.'
            )

        username = options['username']
        user = JustfixUser.objects.get(username=username)

        if not user.email:
            raise CommandError(f"user {username} has no email address!")

        docs = HPActionDocuments.objects.get_latest_for_user(user)

        if not docs:
            raise CommandError(f"user {username} has no HP Action documents to sign!")

        return_url = absolutify_url('/')

        envelope_definition = docusign.create_envelope_definition_for_hpa(docs)
        _, url = docusign.create_envelope_and_recipient_view_for_hpa(
            user=user,
            envelope_definition=envelope_definition,
            access_token=access_token,
            return_url=return_url,
        )

        print(f"To sign, visit this URL within 5 minutes: {url}")
        print(f"When done, you will be redirected to {return_url}.")
