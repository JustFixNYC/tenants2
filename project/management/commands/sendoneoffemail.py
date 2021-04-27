from typing import Optional, Set
from django.core.management import BaseCommand, CommandError
from django.core.mail import send_mail

from users.models import JustfixUser
from project.util.site_util import SITE_CHOICES
from frontend.static_content import react_render_email
from . import oneoffemailusers


SENDER_NAME = "JustFix.nyc"

LOGFILE = oneoffemailusers.OUTFILE.with_suffix(".log")


def send_email(user: JustfixUser):
    url = f"/one-off-email.html"
    email = react_render_email(
        SITE_CHOICES.NORENT,
        user.locale,
        url[1:],
        locale_prefix_url=True,
        is_html_email=True,
        user=user,
    )

    sender = f"{SENDER_NAME} <no-reply@justfix.nyc>"
    recipient = user.email

    send_mail(
        subject=email.subject,
        from_email=sender,
        recipient_list=[recipient],
        message=email.body,
        html_message=email.html_body,
    )

    print(f"Email sent to {user.username}.")


class Command(BaseCommand):
    help = "Send one-off emails."

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            help=(
                f"The username of the user to send the email to. Default is "
                f"to send email to all users we haven't yet emailed."
            ),
        )

    def handle(self, *args, **options):
        username: Optional[str] = options["user"]

        if username:
            user = JustfixUser.objects.get(username=username)
            send_email(user)
            return

        if not oneoffemailusers.OUTFILE.exists():
            raise CommandError("Please run `manage.py oneoffemailusers` first!")

        already_sent: Set[str] = set()

        if LOGFILE.exists():
            already_sent = set(LOGFILE.read_text().splitlines())

        print(f"Loading {oneoffemailusers.OUTFILE}.")
        usernames = [
            username
            for username in oneoffemailusers.OUTFILE.read_text().splitlines()
            if username not in already_sent
        ]
        for username in usernames:
            user = JustfixUser.objects.get(username=username)
            send_email(user)
            with LOGFILE.open("a") as f:
                f.write(username + "\n")
                f.flush()
        print("Done sending emails.")
