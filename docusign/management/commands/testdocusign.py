from django.core.management.base import BaseCommand

from docusign import core


class Command(BaseCommand):
    help = 'Test that DocuSign integration works.'

    def handle(self, *args, **options) -> None:
        print("Ensuring DocuSign configuration is valid...")
        core.ensure_valid_configuration()
        config = core.get_config()
        print("Requesting JWT user token from DocuSign...")
        token = core.request_jwt_user_token(config.consent_code)
        print("Validating token permissions...")
        base_uri = core.get_account_base_uri(token)
        assert config.base_uri == base_uri
        print("Success! DocuSign integration appears to be working.")
