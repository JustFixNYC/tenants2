from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings

from project.util.site_util import SITE_CHOICES
from frontend.static_content import react_render_email


class Command(BaseCommand):
    help = 'Send a test HTML email.'

    def add_arguments(self, parser):
        parser.add_argument('email')

    def handle(self, *args, **options):
        email = react_render_email(
            SITE_CHOICES.JUSTFIX,
            "en",
            "dev/examples/static-html-email.html",
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
