import datetime
from typing import Optional
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.utils import timezone

from users.models import JustfixUser, PHONE_NUMBER_LEN
from project.common_data import Choices
from project.util.site_util import absolutify_url

# https://support.twilio.com/hc/en-us/articles/223134387-What-is-a-Message-SID-
TWILIO_SID_LENGTH = 34

REMINDERS = Choices([
    ('LOC', 'Letter of complaint reminder'),
])


def join_words(*words: Optional[str]) -> str:
    '''
    Join together the given words, filtering out any
    falsy values, e.g.:

        >>> join_words('hi', '', None, 'there')
        'hi there'
    '''

    return ' '.join(filter(None, words))


class PhoneNumberLookupManager(models.Manager):
    def get_or_lookup(self, phone_number: str) -> Optional['PhoneNumberLookup']:
        '''
        Attept to retrieve the PhoneNumberLookup with the given phone number.
        If one doesn't exist, attempt to contact Twilio to validate the number
        and obtain carrier information about it.

        Return None if Twilio integration is disabled or a network error occured.
        '''

        from .twilio import is_phone_number_valid

        lookup = self.filter(phone_number=phone_number).first()
        if lookup is not None:
            return lookup

        is_valid = is_phone_number_valid(phone_number)
        if is_valid is None:
            return None
        lookup = PhoneNumberLookup(phone_number=phone_number, is_valid=is_valid)
        lookup.save()
        return lookup


class PhoneNumberLookup(models.Model):
    '''
    Information looked-up about a phone number via Twilio.
    '''

    phone_number = models.CharField(
        max_length=PHONE_NUMBER_LEN,
        unique=True,
        help_text="A U.S. phone number without parentheses or hyphens, e.g. \"5551234567\"."
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    is_valid = models.BooleanField(
        help_text='Whether Twilio thinks the phone number is valid.'
    )

    carrier = JSONField(
        default=None,
        null=True,
        help_text=(
            "Carrier information about the phone number. This is in the format "
            'specified in <a href="https://www.twilio.com/docs/lookup/api#lookups-carrier-info">'
            "Twilio's carrier information documentation</a>, though the keys are in snake-case "
            "rather than camel-case. This can be None if carrier info has not been looked up."
        )
    )

    objects = PhoneNumberLookupManager()

    def save(self, *args, **kwargs):
        '''
        Save the model, but first attempt to fetch carrier information if possible.
        '''

        from .twilio import get_carrier_info

        if self.carrier is None and self.is_valid:
            self.carrier = get_carrier_info(self.phone_number)

        super().save(*args, **kwargs)

    @property
    def validity_str(self) -> str:
        '''
        Return an adjective describing the validity of the phone number.
        '''

        if self.is_valid is True:
            return 'valid'
        elif self.is_valid is False:
            return 'invalid'
        return 'unknown'

    @property
    def carrier_type(self) -> str:
        '''
        Return the carrier type of the phone number, or the empty
        string if it's not available. Valid carrier types include
        'landline', 'mobile', and 'voip'.
        '''

        ctype = self.carrier and self.carrier.get('type')
        if ctype:
            return ctype
        return ''

    @property
    def adjectives(self) -> str:
        '''
        Return a set of adjectives describing the type, e.g.:

            >>> PhoneNumberLookup().adjectives
            'unknown'

            >>> PhoneNumberLookup(is_valid=True, carrier={'type': 'mobile'}).adjectives
            'valid mobile'
        '''

        return join_words(self.validity_str, self.carrier_type)

    def __str__(self) -> str:
        '''
        Return a description of the lookup, e.g.:

            >>> str(PhoneNumberLookup())
            'unknown phone number'

            >>> str(PhoneNumberLookup(is_valid=True, phone_number='5551234567'))
            'valid phone number 5551234567'
        '''

        return join_words(self.adjectives, 'phone number', self.phone_number)


class Reminder(models.Model):
    '''
    This model represents a reminder sent to users.
    '''

    kind = models.TextField(
        max_length=30, choices=REMINDERS.choices,
        help_text="The type of reminder sent."
    )

    sent_at = models.DateField(
        help_text="When the reminder was sent."
    )

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='reminders',
        help_text="The user the reminder was sent to."
    )

    sid = models.CharField(
        max_length=TWILIO_SID_LENGTH,
        help_text="The Twilio Message SID for the reminder."
    )


# After these many days have passed since the user
# signed up, we will send them a reminder, unless they
# have completed the LoC process.
DAYS_UNTIL_LOC_REMINDER = 3


def get_users_to_remind_about_loc():
    days_ago = timezone.now() - datetime.timedelta(days=DAYS_UNTIL_LOC_REMINDER)
    return JustfixUser.objects.filter(
        date_joined__lte=days_ago,
        onboarding_info__can_we_sms=True,
        letter_request__isnull=True,
    ).exclude(
        reminders__kind=REMINDERS.LOC
    )


def remind_user_about_loc(user):
    url = absolutify_url('/')
    sid = user.send_sms(
        f'Hey {user.first_name}! '
        f'Don\'t forget that you can use JustFix.nyc to address '
        f'repair issues in your apartment. '
        f'Follow this link to continue: {url}'
    )
    if sid:
        Reminder(
            kind=REMINDERS.LOC,
            sent_at=timezone.now(),
            user=user,
            sid=sid
        ).save()
