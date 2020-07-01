from django.core.management.base import BaseCommand

from project.util.site_util import SITE_CHOICES
from project.util.html_to_text import html_to_text
from frontend.static_content import react_render, ContentType


class Command(BaseCommand):
    help = 'Send a test HTML email.'

    def add_arguments(self, parser):
        parser.add_argument('email')

    def handle(self, *args, **options):
        lr = react_render(
            SITE_CHOICES.JUSTFIX,
            "en",
            "dev/examples/static-html-email",
            ContentType.HTML,
            locale_prefix_url=False,
        )

        text = html_to_text(lr.html)

        print(text)

        # TODO: Actually send email.
        # email: str = options['email']
