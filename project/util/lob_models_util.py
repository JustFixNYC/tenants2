from django.db import models
from .lob_django_util import SendableViaLobMixin
from project.locales import LOCALE_KWARGS


class MailItem(models.Model, SendableViaLobMixin):
    """
    A piece of mail (e.g., a letter or declaration) that is ready to be sent,
    or has already been sent.
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