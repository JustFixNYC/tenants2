from django.db import models
from django.db.models.fields.related import ForeignKey
from users.models import JustfixUser
from project import common_data

LETTER_TYPE_CHOICES = common_data.Choices.from_file("la-letter-builder-letter-choices.json")


class LaLetterDetails(models.Model):
    """
    Information about a particular letter a user is in the process of creating.
    """

    user = ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="la_letter_details",
        help_text="The user these letter details relate to",
    )

    letter_type: str = models.CharField(
        max_length=20,
        blank=True,
        choices=LETTER_TYPE_CHOICES.choices,
        help_text="The type of letter the tenant is creating in this session.",
    )
