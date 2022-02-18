from django.db import models
from .lob_django_util import SendableViaLobMixin
from project.locales import LOCALE_KWARGS


class MailItem(models.Model, SendableViaLobMixin):
    """
    A piece of mail (e.g., a letter or declaration) that is ready to be sent,
    or has already been sent.

    Used for EvictionFree, NoRent, LALetterBuilder
    """

    class Meta:
        abstract = True

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    locale = models.CharField(
        **LOCALE_KWARGS,
        help_text=(
            "The locale of the user who sent the mail item, at the time that "
            "they sent it. Note that this may be different from the user's "
            "current locale, e.g. if they changed it after sending the "
            "mail item."
        ),
    )

    lob_letter_object = models.JSONField(
        blank=True,
        null=True,
        help_text=(
            "If the mail item was sent via Lob, this is the JSON response of the API call that "
            "was made to send the mail item, documented at https://lob.com/docs/python#letters."
        ),
    )

    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="The USPS tracking number for the mail item.",
    )


class LocalizedHTMLLetter(MailItem):
    """
    A mail item for products in multiple languages.

    Used for NoRent and LA Letter Builder
    """
    class Meta:
        abstract = True

    html_content = models.TextField(
        help_text=("The HTML content of the letter at the time it was sent, in " "English.")
    )

    localized_html_content = models.TextField(
        help_text=(
            "The HTML content of the letter at the time it was sent, in "
            "the user's locale at the time they sent it. If the user's "
            "locale is English, this will be blank (since the English "
            "version is already stored in another field)."
        ),
        blank=True,
    )

    letter_sent_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was mailed."
    )

    letter_emailed_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was e-mailed."
    )

    fully_processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the letter was fully processed, i.e. sent to all relevant parties.",
    )
