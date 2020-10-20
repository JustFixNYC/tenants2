from django.core.management import BaseCommand
from users.models import JustfixUser


class Command(BaseCommand):
    def handle(self, *args, **options):
        users = JustfixUser.objects.filter(
            onboarding_info__state="CA",
            onboarding_info__can_we_sms=True,
        )
        print(f"Total users to send reminders to: {users.count()}")
