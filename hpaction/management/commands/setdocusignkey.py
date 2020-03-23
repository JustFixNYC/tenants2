import sys
from django.core.management.base import BaseCommand

from hpaction.models import DocusignConfig


class Command(BaseCommand):
    help = 'Set the DocuSign private key from stdin.'

    # 'stdin' can be passed in from the test suite.
    stealth_options = ('stdin',)

    def handle(self, *args, **options) -> None:
        stdin = options.get('stdin', sys.stdin)
        private_key = stdin.read()
        cfg = DocusignConfig.objects.get()
        cfg.private_key = private_key
        cfg.save()
        self.stdout.write("Saved DocuSign private key to database.\n")
