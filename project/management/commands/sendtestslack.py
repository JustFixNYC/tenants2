from django.conf import settings
from django.core.management.base import CommandError, BaseCommand
from django.contrib.sites.models import Site

from project.slackbot import sendmsg
from project.util.site_util import absolutify_url


class Command(BaseCommand):
    help = 'Send a test Slack message.'

    def handle(self, *args, **options):
        url = absolutify_url('/')
        name = Site.objects.get_current().name

        if not settings.SLACKBOT_WEBHOOK_URL:
            raise CommandError("SLACKBOT_WEBHOOK_URL must be configured.")

        if not sendmsg(f"Hi, this is a test message from <{url}|{name}>!"):
            raise CommandError("Sending test Slack message failed.")

        self.stdout.write("Test Slack message sent successfully!\n")
