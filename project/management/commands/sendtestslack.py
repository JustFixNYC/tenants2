from django.conf import settings
from django.core.management.base import CommandError, BaseCommand

from project.slack import sendmsg


class Command(BaseCommand):
    help = 'Send a test Slack message.'

    def handle(self, *args, **options):
        if not settings.SLACK_WEBHOOK_URL:
            raise CommandError("SLACK_WEBHOOK_URL must be configured.")

        if not sendmsg(f"Hi, this is a test message sent via `manage.py sendtestslack`!"):
            raise CommandError("Sending test Slack message failed.")

        self.stdout.write("Test Slack message sent successfully!\n")
