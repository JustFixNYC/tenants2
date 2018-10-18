from django.conf import settings
from django.core.management.base import CommandError, BaseCommand
from django.contrib.sites.models import Site

from project.slack import sendmsg, hyperlink
from project.util.site_util import absolutify_url


class Command(BaseCommand):
    help = 'Send a test Slack message.'

    def handle(self, *args, **options):
        if not settings.SLACK_WEBHOOK_URL:
            raise CommandError("SLACK_WEBHOOK_URL must be configured.")

        link = hyperlink(text=Site.objects.get_current().name,
                         href=absolutify_url('/'))
        if not sendmsg(f"Hi, this is a test message sent from {link}!", is_safe=True):
            raise CommandError("Sending test Slack message failed.")

        self.stdout.write("Test Slack message sent successfully!\n")
