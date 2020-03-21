from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from project.util.site_util import absolutify_url
from hpaction import docusign


class Command(BaseCommand):
    help = (
        'Authenticate with DocuSign.'
    )

    def handle(self, *args, **options) -> None:
        if not settings.DOCUSIGN_INTEGRATION_KEY:
            raise CommandError('DocuSign is not configured!')

        url = docusign.create_oauth_consent_url(
            return_url=absolutify_url('/'),
        )

        print(f"Please visit this URL: {url}")
