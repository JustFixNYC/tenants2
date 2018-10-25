import logging
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager
from django.utils.crypto import get_random_string

from project import twilio
from project.util.site_util import absolute_reverse


PHONE_NUMBER_LEN = 10

FULL_NAME_MAXLEN = 150


logger = logging.getLogger(__name__)


class JustfixUserManager(UserManager):
    def generate_random_username(self, prefix='') -> str:
        while True:
            username = prefix + get_random_string(
                length=12,
                allowed_chars='abcdefghijklmnopqrstuvwxyz'
            )
            if not self.filter(username=username).exists():
                return username


class JustfixUser(AbstractUser):
    phone_number = models.CharField(
        'Phone number',
        max_length=PHONE_NUMBER_LEN,
        unique=True,
        help_text="A U.S. phone number without parentheses or hyphens, e.g. \"5551234567\"."
    )

    objects = JustfixUserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['username', 'email']

    @property
    def full_name(self) -> str:
        if self.first_name and self.last_name:
            return ' '.join([self.first_name, self.last_name])
        return ''

    def formatted_phone_number(self) -> str:
        if len(self.phone_number) != PHONE_NUMBER_LEN:
            return self.phone_number
        area_code = self.phone_number[0:3]
        first_three_digits = self.phone_number[3:6]
        last_digits = self.phone_number[6:]
        return f"({area_code}) {first_three_digits}-{last_digits}"

    def send_sms(self, body: str, fail_silently=True):
        if hasattr(self, 'onboarding_info') and self.onboarding_info.can_we_sms:
            twilio.send_sms(self.phone_number, body, fail_silently=fail_silently)

    @property
    def admin_url(self):
        return absolute_reverse('admin:users_justfixuser_change', args=[self.pk])

    def __str__(self):
        if self.username:
            return self.username
        return '<unnamed user>'
