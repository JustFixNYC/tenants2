from datetime import timedelta
from django.utils import timezone
from django.core.management.base import BaseCommand

from users.models import JustfixUser


def get_users_to_remind_about_letter_of_complaint():
    today = timezone.now()
    three_days_ago = today - timedelta(days=3)

    return JustfixUser.objects.filter(
        date_joined__lte=three_days_ago,
        onboarding_info__can_we_sms=True,
        onboarding_info__finish_cta_reminder_sent_at__isnull=True,
        letter_request__isnull=True
    )


class Command(BaseCommand):
    help = 'Send reminder text messages to users who have not sent a letter of complaint.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', help="don't actually send messages.",
                            action='store_true')

    def handle(self, *args, **options) -> None:
        print("Sending reminders to users who haven't yet finished their letter of complaint.")
        for user in get_users_to_remind_about_letter_of_complaint():
            print(f'Sending a reminder to {user.username}.')
            if not options['dry_run']:
                # TODO: Actually send SMS.
                user.onboarding_info.finish_cta_reminder_sent_at = timezone.now()
                user.onboarding_info.save()
        print("Done.")
