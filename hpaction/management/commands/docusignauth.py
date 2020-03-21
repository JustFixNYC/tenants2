from django.core.management.base import BaseCommand

from project.util.site_util import absolutify_url
from hpaction import docusign


class Command(BaseCommand):
    help = (
        'Authenticate with DocuSign.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--code', help="The code returned by the OAuth consent flow.")

    def handle(self, *args, **options) -> None:
        docusign.ensure_valid_configuration()

        code = options['code']

        if code:
            print(f"Requesting access token...")
            token = docusign.request_jwt_user_token(code)
            print(f"Success!  Your {token.token_type} access token is: {token.access_token}")
            print(f"It expires in {token.expires_in} seconds.")
        else:
            url = docusign.create_oauth_consent_url(
                return_url=absolutify_url('/'),
            )

            print(f"You need to start the OAuth consent flow.")
            print(f"Please visit this URL: {url}")
            print(f"When finished, the address bar will contain a 'code' querystring argument.")
            print(f"Copy that and provide it as the --code argument for this command.")
