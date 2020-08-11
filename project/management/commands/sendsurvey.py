from typing import Optional, Set
from urllib.parse import urlencode
from django.core.management import BaseCommand, CommandError
from django.core.mail import send_mail

from users.models import JustfixUser
from project.util.site_util import SITE_CHOICES
from frontend.static_content import react_render_email
from . import spanishusers


SENDER_NAME = "Tahnee Pantig"

LOGFILE = spanishusers.OUTFILE.with_suffix('.log')


def send_survey(user: JustfixUser):
    url = f"/es/spanish-survey-email.html?{urlencode({'sender': SENDER_NAME})}"
    email = react_render_email(
        SITE_CHOICES.NORENT,
        "es",
        url[1:],
        locale_prefix_url=False,
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
    help = 'Send Spanish survey emails.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            help=(
                f"The username of the user to send the email to. Default is "
                f"to send email to all users we haven't yet emailed."
            )
        )

    def handle(self, *args, **options):
        username: Optional[str] = options['user']

        if username:
            user = JustfixUser.objects.get(username=username)
            send_survey(user)
            return

        if not spanishusers.OUTFILE.exists():
            raise CommandError('Please run `manage.py spanishusers` first!')

        already_sent: Set[str] = set()

        if LOGFILE.exists():
            already_sent = set(LOGFILE.read_text().splitlines())

        print(f"Loading {spanishusers.OUTFILE}.")
        usernames = [
            username for username
            in spanishusers.OUTFILE.read_text().splitlines()
            if username not in already_sent
        ]
        for username in usernames:
            user = JustfixUser.objects.get(username=username)
            send_survey(user)
            with LOGFILE.open('a') as f:
                f.write(username + '\n')
                f.flush()
        print("Done sending emails.")
