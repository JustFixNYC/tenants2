from typing import List, Dict
from django.db import models
from project.common_data import Choices


# These were adapted from:
# https://github.com/django/django-localflavor/blob/master/localflavor/us/us_states.py
US_STATE_CHOICES = Choices.from_file('us-state-choices.json')


class MailingAddress(models.Model):
    '''
    A base Django model for storing mailing address information.

    It only supports mailing to U.S. states and territories.
    '''

    class Meta:
        abstract = True

    primary_line = models.CharField(
        max_length=255,
        blank=True,
        help_text='Usually the first line of the address, e.g. "150 Court Street"'
    )

    secondary_line = models.CharField(
        max_length=255,
        blank=True,
        help_text='Optional. Usually the second line of the address, e.g. "Suite 2"'
    )

    urbanization = models.CharField(
        max_length=80,
        blank=True,
        help_text='Optional. Only used for addresses in Puerto Rico.'
    )

    city = models.CharField(
        max_length=80,
        blank=True,
        help_text='The city of the address, e.g. "Brooklyn".'
    )

    state = models.CharField(
        max_length=2,
        blank=True,
        choices=US_STATE_CHOICES.choices,
        help_text='The two-letter state or territory for the address, e.g. "NY".'
    )

    zip_code = models.CharField(
        max_length=10,
        blank=True,
        help_text='The zip code of the address, e.g. "11201" or "94107-2282".'
    )

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
