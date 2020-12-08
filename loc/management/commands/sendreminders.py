from django.core.management.base import BaseCommand

from loc.sms_reminders import LocReminder


class Command(BaseCommand):
    help = 'Send reminder text messages to users who have not sent a letter of complaint.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually send messages.",
                            action='store_true')

    def handle(self, *args, **options) -> None:
        dry_run: bool = options['dry_run']
        print("Sending reminders to users who haven't yet finished their letter of complaint.")
        LocReminder(dry_run=dry_run).remind_users()
        print("Done.")
