from django.core.management.base import BaseCommand

from reminders import models


class Command(BaseCommand):
    help = 'Send reminder text messages to users who have not sent a letter of complaint.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually send messages.",
                            action='store_true')

    def handle(self, *args, **options) -> None:
        print("Sending reminders to users who haven't yet finished their letter of complaint.")
        for user in models.get_users_to_remind_about_loc():
            print(f'Sending a reminder to {user.username}.')
            if not options['dry_run']:
                models.remind_user_about_loc(user)
        print("Done.")
