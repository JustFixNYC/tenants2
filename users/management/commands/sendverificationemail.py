from django.core.management import BaseCommand, CommandError

from users.models import JustfixUser
from users.email_verify import send_verification_email


class Command(BaseCommand):
    help = "Sends a verification email to a user."

    def add_arguments(self, parser):
        parser.add_argument("username", help="The username to send an email to.")

    def handle(self, *args, **options):
        user = JustfixUser.objects.get(username=options["username"])
        if not user.email:
            raise CommandError("User does not have an email address!")
        send_verification_email(user.pk)
        self.stdout.write(f"Verification email sent to {user.email}.")
