from typing import List, Dict, Union, Any
from django.db import models

from project.common_data import Choices
from project import geocoding
from users.models import JustfixUser


BOROUGH_CHOICES = Choices.from_file('borough-choices.json')

LEASE_CHOICES = Choices.from_file('lease-choices.json')

ADDR_META_HELP = (
    "This field is automatically updated when you change the address or "
    "borough, so you generally shouldn't have to change it manually."
)


class InstanceChangeTracker:
    '''
    A utility class that can be used to help keep track of whether a model's
    fields have changed during its lifetime as a Python object.

    It is *not* useful for tracking a model's changes over time in a database.

    For example, given the following model:

        >>> from dataclasses import dataclass
        >>> @dataclass
        ... class Thing:
        ...    foo: str
        ...    bar: str
        >>> thing = Thing('hello', 'there')

    We can create a tracker on its "foo" property, which tells us its
    instance hasn't been changed:

        >>> tracker = InstanceChangeTracker(thing, ['foo'])
        >>> tracker.has_changed()
        False

    Once we change the "foo" property, it tells us it has been changed:

        >>> thing.foo = "zzz"
        >>> tracker.has_changed()
        True

    We can then tell it to consider the current state as being unchanged:

        >>> tracker.set_to_unchanged()
        >>> tracker.has_changed()
        False
    '''

    # The types of fields we support.
    field_type = Union[str]

    # A dictionary that keeps track of the "original" values of a model's
    # fields.
    original_values: Dict[str, field_type]

    def __init__(self, instance: Any, field_names: List[str]) -> None:
        self.instance = instance
        self.field_names = field_names
        self.original_values = {}
        self.set_to_unchanged()

    def are_any_fields_blank(self) -> bool:
        '''
        Returns whether or not the current value of any of our tracked fields
        are blank/empty.
        '''

        for name in self.field_names:
            if not getattr(self.instance, name):
                return True
        return False

    def set_to_unchanged(self) -> None:
        '''
        Remember the current values of the tracked fields as being the "original"
        values.
        '''

        for name in self.field_names:
            value = getattr(self.instance, name)
            self.original_values[name] = value

    def has_changed(self) -> bool:
        '''
        Return whether our tracked fields have changed since we were initialized,
        or since set_to_unchanged() was last called.
        '''

        for name in self.field_names:
            value = getattr(self.instance, name)
            if value != self.original_values[name]:
                return True
        return False


class OnboardingInfo(models.Model):
    '''
    The details a user filled out when they joined the site.
    '''

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # This keeps track of the fields that comprise our address.
        self.__addr = InstanceChangeTracker(self, ['address', 'borough'])

        # This keeps track of fields that comprise metadata about our address,
        # which can be determined from the fields comprising our address.
        self.__addr_meta = InstanceChangeTracker(self, ['zipcode'])

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='onboarding_info')

    address = models.CharField(
        max_length=200,
        help_text="The user's address. Only street name and number are required."
    )

    address_verified = models.BooleanField(
        help_text=(
            "Whether we've verified, on the server-side, that the user's "
            "address is valid."
        )
    )

    borough = models.CharField(
        max_length=20, choices=BOROUGH_CHOICES.choices,
        help_text="The New York City borough the user's address is in."
    )

    zipcode = models.CharField(
        # https://stackoverflow.com/q/325041/2422398
        max_length=12,
        blank=True,
        help_text=f"The user's ZIP code. {ADDR_META_HELP}"
    )

    apt_number = models.CharField(max_length=10)

    is_in_eviction = models.BooleanField(
        help_text="Has the user received an eviction notice?")

    needs_repairs = models.BooleanField(
        help_text="Does the user need repairs in their apartment?")

    has_no_services = models.BooleanField(
        help_text="Is the user missing essential services like water?")

    has_pests = models.BooleanField(
        help_text="Does the user have pests like rodents or bed bugs?")

    has_called_311 = models.BooleanField(
        help_text="Has the user called 311 before?")

    lease_type = models.CharField(
        max_length=30, choices=LEASE_CHOICES.choices,
        help_text="The type of lease the user has on their dwelling.")

    receives_public_assistance = models.BooleanField(
        help_text="Does the user receive public assistance, e.g. Section 8?")

    can_we_sms = models.BooleanField(
        help_text="Whether we can contact the user via SMS to follow up.")

    @property
    def borough_label(self) -> str:
        if not self.borough:
            return ''
        return BOROUGH_CHOICES.get_label(self.borough)

    @property
    def city(self) -> str:
        '''
        The city of the user. This will be the same as the borough name,
        except we use "New York" instead of "Manhattan".
        '''

        if not self.borough:
            return ''
        if self.borough == BOROUGH_CHOICES.MANHATTAN:
            return 'New York'
        return self.borough_label

    @property
    def full_address(self) -> str:
        '''Return the full address for purposes of geolocation, etc.'''

        if not (self.borough and self.address):
            return ''
        return f"{self.address}, {self.borough_label}"

    @property
    def address_lines_for_mailing(self) -> List[str]:
        '''Return the full mailing address as a list of lines.'''

        result: List[str] = []
        if self.address:
            result.append(self.address)
        if self.apt_number:
            result.append(f"Apartment {self.apt_number}")
        if self.borough:
            result.append(f"{self.city}, NY {self.zipcode}".strip())

        return result

    def __str__(self):
        if not (self.created_at and self.user and self.user.full_name):
            return super().__str__()
        return (
            f"{self.user.full_name}'s onboarding info from "
            f"{self.created_at.strftime('%A, %B %d %Y')}"
        )

    def __should_lookup_new_addr_metadata(self) -> bool:
        if self.__addr.are_any_fields_blank():
            # We can't even look up address metadata without a
            # full address.
            return False

        if self.__addr_meta.are_any_fields_blank():
            # We have full address information but no
            # address metadata, so let's look it up!
            return True

        if self.__addr.has_changed() and not self.__addr_meta.has_changed():
            # The address information has changed but our address
            # metadata has not, so let's look it up again.
            return True

        return False

    def lookup_addr_metadata(self):
        features = geocoding.search(self.full_address)
        if features:
            self.zipcode = features[0].properties.postalcode
        self.__addr.set_to_unchanged()
        self.__addr_meta.set_to_unchanged()

    def maybe_lookup_new_addr_metadata(self) -> bool:
        if self.__should_lookup_new_addr_metadata():
            self.lookup_addr_metadata()
            return True
        return False

    def save(self, *args, **kwargs):
        self.maybe_lookup_new_addr_metadata()
        return super().save(*args, **kwargs)
