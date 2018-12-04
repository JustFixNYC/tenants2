import re
import logging
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser, UserManager, Permission
from django.utils.crypto import get_random_string

from texting import twilio
from project.util.site_util import absolute_reverse


PHONE_NUMBER_LEN = 10

ALL_DIGITS_RE = re.compile(r'[0-9]+')

FULL_NAME_MAXLEN = 150

VIEW_LETTER_REQUEST_PERMISSION = 'loc.view_letterrequest'

ROLES = {}

ROLES['Outreach Coordinators'] = set([
    'users.add_justfixuser',
    'users.change_justfixuser',
    'legacy_tenants.change_legacyuserinfo',
    'loc.add_accessdate',
    'loc.change_accessdate',
    'loc.delete_accessdate',
    'loc.add_landlorddetails',
    'loc.change_landlorddetails',
    'loc.add_letterrequest',
    'loc.change_letterrequest',
    'loc.delete_letterrequest',
    VIEW_LETTER_REQUEST_PERMISSION,
    'onboarding.add_onboardinginfo',
    'onboarding.change_onboardinginfo',
])


logger = logging.getLogger(__name__)


def get_permissions_from_ns_codenames(ns_codenames):
    '''
    Returns a list of Permission objects for the specified namespaced codenames
    '''

    splitnames = [ns_codename.split('.') for ns_codename in ns_codenames]
    return [
        Permission.objects.get(codename=codename,
                               content_type__app_label=app_label)
        for app_label, codename in splitnames
    ]


def validate_phone_number(value: str) -> None:
    if len(value) != PHONE_NUMBER_LEN:
        raise ValidationError(f'U.S. phone numbers must be {PHONE_NUMBER_LEN} digits.')
    if not ALL_DIGITS_RE.fullmatch(value):
        raise ValidationError(f'Phone numbers can only contain digits.')
    if value[0] in ('0', '1'):
        # 0 and 1 are invalid leading digits of area codes:
        # https://en.wikipedia.org/wiki/List_of_North_American_Numbering_Plan_area_codes
        raise ValidationError(f'{value[0:3]} is an invalid area code.')


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
        validators=[validate_phone_number],
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

    def send_sms(self, body: str, fail_silently=True) -> str:
        if hasattr(self, 'onboarding_info') and self.onboarding_info.can_we_sms:
            return twilio.send_sms(self.phone_number, body, fail_silently=fail_silently)
        return ''

    @property
    def admin_url(self):
        return absolute_reverse('admin:users_justfixuser_change', args=[self.pk])

    def __str__(self):
        if self.username:
            return self.username
        return '<unnamed user>'
