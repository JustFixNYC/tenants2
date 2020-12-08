from django.core.management.base import BaseCommand

from docusign import core


class Command(BaseCommand):
    help = "Test that DocuSign integration works."

    def handle(self, *args, **options) -> None:
        self.stdout.write("Ensuring DocuSign configuration is valid...\n")
        core.ensure_valid_configuration()
        config = core.get_config()
        self.stdout.write("Requesting JWT user token from DocuSign...\n")
        token = core.request_jwt_user_token(config.consent_code)
        self.stdout.write("Validating token permissions...\n")
        base_uri = core.get_account_base_uri(token)
        assert config.base_uri == base_uri
        self.stdout.write("Success! DocuSign integration appears to be working.\n")
