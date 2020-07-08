from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings

from project.util.site_util import SITE_CHOICES
from frontend.static_content import react_render_email


DEFAULT_URL = '/dev/examples/static-html-email.html'


class Command(BaseCommand):
    help = 'Send a test HTML email.'

    def add_arguments(self, parser):
        parser.add_argument('email')
        parser.add_argument(
            '--url',
            default=DEFAULT_URL,
            help=(
                f"The URL (pathname) to the HTML email content. "
                f"Defaults to {DEFAULT_URL}."
            )
        )

    def handle(self, *args, **options):
        url: str = options['url']

        email = react_render_email(
            SITE_CHOICES.JUSTFIX,
            "en",
            url[1:],
            locale_prefix_url=False,
            is_html_email=True,
        )

        recipient: str = options['email']

        send_mail(
            subject=email.subject,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            message=email.body,
            html_message=email.html_body,
        )

        print("Email sent.")
