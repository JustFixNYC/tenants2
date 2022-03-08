from . import models
from users.models import JustfixUser
from frontend.static_content import (
    react_render,
    ContentType,
)
from project.util.site_util import SITE_CHOICES
from project import locales
from django.db import transaction


# The URL, relative to the localized site root, that renders the LA Letter builder
# letter PDF.
LALETTERBUILDER_LETTER_PDF_URL = "letter.pdf"

# The URL, relative to the localized site root, that renders the LA Letter builder
# email to the landlord.
LALETTERBUILDER_EMAIL_TO_LANDLORD_URL = "letter-email.txt"

# The URL, relative to the localized site root, that renders the LA Letter builder
# email to the user.
LALETTERBUILDER_EMAIL_TO_USER_URL = "letter-email-to-user.html"


def create_letter(user: JustfixUser) -> models.Letter:
    """
    Create a blank Letter model. HTML content is required but it will be trivial until
    the user sends the letter.
    """

    with transaction.atomic():
        # TODO: Make this work for any type of letter
        letter = models.HabitabilityLetter(
            user=user,
            locale=user.locale,
            html_content="<>",
        )
        letter.full_clean()
        letter.save()

    return letter


def send_letter(letter: models.Letter):
    user = letter.user

    html_content = react_render(
        SITE_CHOICES.LALETTERBUILDER,
        locales.DEFAULT,
        LALETTERBUILDER_LETTER_PDF_URL,
        ContentType.PDF,
        user=user,
    ).html

    localized_html_content = ""
    if user.locale != locales.DEFAULT:
        localized_html_content = react_render(
            SITE_CHOICES.LALETTERBUILDER,
            user.locale,
            LALETTERBUILDER_LETTER_PDF_URL,
            ContentType.PDF,
            user=user,
        ).html

    with transaction.atomic():
        letter.html_content = html_content
        letter.localized_html_content = localized_html_content
        letter.full_clean()
        letter.save()

    # TODO: add actual sending code (model after norent/letter_sending)
