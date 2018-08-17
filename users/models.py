from django.db import models
from django.contrib.auth.models import AbstractUser

PHONE_NUMBER_LEN = 10


class JustfixUser(AbstractUser):
    phone_number = models.CharField(
        'Phone number',
        max_length=PHONE_NUMBER_LEN,
        unique=True,
        help_text="A U.S. phone number without parentheses or hyphens, e.g. \"5551234567\"."
    )

    USERNAME_FIELD = 'phone_number'

    def __str__(self):
        return self.phone_number
