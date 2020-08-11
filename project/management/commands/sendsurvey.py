from typing import Optional
from urllib.parse import urlencode
from django.core.management import BaseCommand
from django.core.mail import send_mail

from users.models import JustfixUser
from project.util.site_util import SITE_CHOICES
from frontend.static_content import react_render_email


SENDER_NAME = "Tahnee Pantig"


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
        url = f"/es/spanish-survey-email.html?{urlencode({'sender': SENDER_NAME})}"
        username: Optional[str] = options['user']
        user = None

        if username:
            user = JustfixUser.objects.get(username=username)

        if user is None:
            raise NotImplementedError("TODO: Send email to all users")

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

        print("Email sent.")
