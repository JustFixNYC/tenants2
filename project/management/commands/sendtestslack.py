from django.conf import settings
from django.core.management.base import CommandError, BaseCommand

from project.slack import sendmsg, hyperlink
from project.util.site_util import absolutify_url, get_default_site


def get_site_hyperlink() -> str:
    return hyperlink(text=get_default_site().name, href=absolutify_url("/"))


class Command(BaseCommand):
    help = "Send a test Slack message."

    def handle(self, *args, **options):
        if not settings.SLACK_WEBHOOK_URL:
            raise CommandError("SLACK_WEBHOOK_URL must be configured.")

        link = get_site_hyperlink()
        if not sendmsg(f"Hi, this is a test message sent from {link}!", is_safe=True):
            raise CommandError("Sending test Slack message failed.")

        self.stdout.write("Test Slack message sent successfully!\n")
