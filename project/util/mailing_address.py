from typing import List, Dict
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _

from project.common_data import Choices


# These were adapted from:
# https://github.com/django/django-localflavor/blob/master/localflavor/us/us_states.py
US_STATE_CHOICES = Choices.from_file('us-state-choices.json')


class ZipCodeValidator(RegexValidator):
    def __init__(self):
        # https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s14.html
        super().__init__(
            regex=r"^[0-9]{5}(?:-[0-9]{4})?$",
            message=_("Enter a valid U.S. zip code.")
        )


CITY_KWARGS = dict(
    max_length=80,
)

STATE_KWARGS = dict(
    max_length=2,
    choices=US_STATE_CHOICES.choices,
)


class MailingAddress(models.Model):
    '''
    A base Django model for storing mailing address information.

    It only supports mailing to U.S. states and territories.
    '''

    class Meta:
        abstract = True

    primary_line = models.CharField(
        max_length=64,
        blank=True,
        help_text='Usually the first line of the address, e.g. "150 Court Street"'
    )

    secondary_line = models.CharField(
        max_length=64,
        blank=True,
        help_text='Optional. Usually the second line of the address, e.g. "Suite 2"'
    )

    urbanization = models.CharField(
        max_length=80,
        blank=True,
        help_text='Optional. Only used for addresses in Puerto Rico.'
    )

    city = models.CharField(
        **CITY_KWARGS,
        blank=True,
        help_text='The city of the address, e.g. "Brooklyn".'
    )

    state = models.CharField(
        **STATE_KWARGS,
        blank=True,
        help_text='The two-letter state or territory for the address, e.g. "NY".'
    )

    zip_code = models.CharField(
        max_length=10,
        blank=True,
        validators=[ZipCodeValidator()],
        help_text='The zip code of the address, e.g. "11201" or "94107-2282".'
    )

    # Attributes that correspond to parts of the mailing address.
    MAILING_ADDRESS_ATTRS = [
        'primary_line',
        'secondary_line',
        'urbanization',
        'city',
        'state',
        'zip_code'
    ]

    # Attributes that map to keys used by Lob's verifications API:
    LOB_ATTRS = MAILING_ADDRESS_ATTRS

    def as_lob_params(self) -> Dict[str, str]:
        '''
        Returns a dictionary representing the address that can be passed directly
        to Lob's verifications API: https://lob.com/docs#us_verifications_create
        '''

        result: Dict[str, str] = {}
        for attr in self.LOB_ATTRS:
            value = getattr(self, attr)
            if value:
                result[attr] = value
        return result

    def is_address_populated(self) -> bool:
        '''
        Return whether the model contains enough filled-out fields to be used
        to actually mail something.
        '''

        return bool(self.primary_line and self.city and self.state and self.zip_code)

    @property
    def address_lines_for_mailing(self) -> List[str]:
        '''
        Return the full mailing address as a list of lines.  If there aren't
        enough filled-out fields to create a complete mailing address, this
        will return an empty list.
        '''

        if not self.is_address_populated():
            return []
        lines = [self.primary_line]
        if self.secondary_line:
            lines.append(self.secondary_line)
        lines.append(f"{self.city}, {self.state} {self.zip_code}")
        return lines

    def get_address_as_dict(self) -> Dict[str, str]:
        '''
        Returns all the address-related properties of this model as a
        dict.
        '''

        return {
            'primary_line': self.primary_line,
            'secondary_line': self.secondary_line,
            'urbanization': self.urbanization,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
        }

    def clear_address(self):
        self.primary_line = ''
        self.secondary_line = ''
        self.urbanization = ''
        self.city = ''
        self.state = ''
        self.zip_code = ''
