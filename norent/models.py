from django.db import models

from project.util.address_form_fields import ADDRESS_FIELD_KWARGS
from project.util import mailing_address
from users.models import JustfixUser
from onboarding.models import APT_NUMBER_MAX_LENGTH


class NationalOnboardingInfo(models.Model):
    '''
    The details a non-NYC user filled out when they
    joined the site.
    '''

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='national_onboarding_info')

    address = models.CharField(
        **ADDRESS_FIELD_KWARGS,
        help_text="The user's address. Only street name and number are required."
    )

    city = models.CharField(
        **mailing_address.CITY_KWARGS,
        help_text='The user\'s city, e.g. "San Francisco".'
    )

    state = models.CharField(
        **mailing_address.STATE_KWARGS,
        help_text='The two-letter state or territory for the user\'s address, e.g. "CA".'
    )

    zip_code = models.CharField(
        **mailing_address.ZIP_CODE_KWARGS,
        help_text='The zip code of the user, e.g. "94110" or "94107-2282".'
    )

    apt_number = models.CharField(
        max_length=APT_NUMBER_MAX_LENGTH,
        help_text='The user\'s apartment number, e.g. "2A".'
    )
