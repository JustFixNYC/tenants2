from django.db import models
from django.db.models.fields.related import ForeignKey
from users.models import JustfixUser
from project import common_data

LETTER_TYPE_CHOICES = common_data.Choices.from_file("la-letter-builder-letter-choices.json")


class LALetterDetails(models.Model):
    user = ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        help_text="The user these letter details are for.",
    )

    letter_type = models.CharField(
        max_length=20,
        blank=True,
        choices=LETTER_TYPE_CHOICES.choices,
        help_text="The type of letter the tenant is creating in this session.",
    )
