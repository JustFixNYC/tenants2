from django.db import models

from project.common_data import Choices
from users.models import JustfixUser


BOROUGH_CHOICES = Choices.from_file('borough-choices.json')

LEASE_CHOICES = Choices.from_file('lease-choices.json')


class OnboardingInfo(models.Model):
    '''
    The details a user filled out when they joined the site.
    '''

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
        max_length=20, choices=BOROUGH_CHOICES,
        help_text="The New York City borough the user's address is in."
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
        max_length=30, choices=LEASE_CHOICES,
        help_text="The type of lease the user has on their dwelling.")

    receives_public_assistance = models.BooleanField(
        help_text="Does the user receive public assistance, e.g. Section 8?")

    can_we_sms = models.BooleanField(
        help_text="Whether we can contact the user via SMS to follow up.")
