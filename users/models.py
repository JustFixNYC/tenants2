from django.db import models
from django.contrib.auth.models import AbstractUser

PHONE_NUMBER_LEN = 10

FULL_NAME_MAXLEN = 150


class JustfixUser(AbstractUser):
    phone_number = models.CharField(
        'Phone number',
        max_length=PHONE_NUMBER_LEN,
        unique=True,
        help_text="A U.S. phone number without parentheses or hyphens, e.g. \"5551234567\"."
    )

    full_name = models.CharField(
        'Full name',
        max_length=FULL_NAME_MAXLEN,
        blank=True,
        help_text="The user's full name."
    )

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username', 'email']

    def formatted_phone_number(self):
        area_code = self.phone_number[0:3]
        first_three_digits = self.phone_number[3:6]
        last_digits = self.phone_number[6:]
        return f"({area_code}) {first_three_digits}-{last_digits}"

    def __str__(self):
        if self.full_name:
            return f"{self.phone_number} ({self.full_name})"
        return self.phone_number
