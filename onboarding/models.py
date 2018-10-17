from django.db import models

from project.common_data import Choices
from project import geocoding
from users.models import JustfixUser


BOROUGH_CHOICES = Choices.from_file('borough-choices.json')

LEASE_CHOICES = Choices.from_file('lease-choices.json')


class OnboardingInfo(models.Model):
    '''
    The details a user filled out when they joined the site.
    '''

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__remember_original_addr_values()

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
        help_text="The user's ZIP code."
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
    def full_address(self) -> str:
        if not (self.borough and self.address):
            return ''
        return f"{self.address}, {self.borough_label}"

    def __str__(self):
        if not (self.created_at and self.user and self.user.full_name):
            return super().__str__()
        return (
            f"{self.user.full_name}'s onboarding info from "
            f"{self.created_at.strftime('%A, %B %d %Y')}"
        )

    def __remember_original_addr_values(self):
        self.__original_address = self.address
        self.__original_borough = self.borough
        self.__original_zipcode = self.zipcode

    def __should_lookup_new_addr_metadata(self) -> bool:
        if not self.full_address:
            # We can't even look up address metadata without a
            # full address.
            return False

        if not self.zipcode:
            # We have full address information but no
            # address metadata, so let's look it up!
            return True

        has_addr_changed = (self.__original_address != self.address or
                            self.__original_borough != self.borough)
        if has_addr_changed and self.__original_zipcode == self.zipcode:
            # The address information has changed but our address
            # metadata has not, so let's look it up again.
            return True

        return False

    def lookup_addr_metadata(self):
        features = geocoding.search(self.full_address)
        if features:
            self.zipcode = features[0].properties.postalcode

    def maybe_lookup_new_addr_metadata(self) -> bool:
        if self.__should_lookup_new_addr_metadata():
            self.lookup_addr_metadata()
            self.__remember_original_addr_values()
            return True
        return False

    def save(self, *args, **kwargs):
        self.maybe_lookup_new_addr_metadata()
        return super().save(*args, **kwargs)
