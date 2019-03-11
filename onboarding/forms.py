from typing import Tuple
from django import forms
from django.forms import ValidationError
from django.contrib.auth.password_validation import validate_password

from project import geocoding
from project.forms import USPhoneNumberField
from users.models import JustfixUser
from .models import OnboardingInfo, BOROUGH_CHOICES


# Whenever we change the fields in any of the onboarding
# forms, we should change this number to ensure that we
# never use an old session's onboarding data with the
# new validation logic. The downside is that the old
# session's onboarding data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 3

# The keys here were obtained experimentally, I'm not actually sure
# if/where they are formally specified.
BOROUGH_GID_TO_CHOICE = {
    'whosonfirst:borough:1': BOROUGH_CHOICES.MANHATTAN,
    'whosonfirst:borough:2': BOROUGH_CHOICES.BRONX,
    'whosonfirst:borough:3': BOROUGH_CHOICES.BROOKLYN,
    'whosonfirst:borough:4': BOROUGH_CHOICES.QUEENS,
    'whosonfirst:borough:5': BOROUGH_CHOICES.STATEN_ISLAND,
}


def verify_address(address: str, borough: str) -> Tuple[str, str, bool]:
    '''
    Attempt to verify the given address, returning the address, and whether it
    was actually verified. If the address was verified, the returned address
    may have changed.
    '''

    borough_label = BOROUGH_CHOICES.get_label(borough)
    features = geocoding.search(', '.join([address, borough_label]))
    if features is None:
        # Hmm, the geocoding service is unavailable. This
        # is unfortunate, but we don't want it to block
        # onboarding, so keep a note of it and let the
        # user continue.
        address_verified = False
    elif len(features) == 0:
        # The geocoding service is available, but the
        # address produces no results.
        raise forms.ValidationError('The address provided is invalid.')
    else:
        address_verified = True
        props = features[0].properties
        address = props.name
        borough = BOROUGH_GID_TO_CHOICE[props.borough_gid]
    return address, borough, address_verified


class OnboardingStep1Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('address', 'borough', 'apt_number')

    first_name = forms.CharField(max_length=30)

    last_name = forms.CharField(max_length=150)

    def clean(self):
        cleaned_data = super().clean()
        address = cleaned_data.get('address')
        borough = cleaned_data.get('borough')
        if address and borough:
            address, borough, address_verified = verify_address(address, borough)
            cleaned_data['address'] = address
            cleaned_data['borough'] = borough
            cleaned_data['address_verified'] = address_verified
        return cleaned_data


class OnboardingStep2Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = (
            'is_in_eviction', 'needs_repairs', 'has_no_services',
            'has_pests', 'has_called_311'
        )


class OnboardingStep3Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('lease_type', 'receives_public_assistance')


class OnboardingStep4Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('can_we_sms', 'signup_intent')

    phone_number = USPhoneNumberField()

    password = forms.CharField(required=False)

    confirm_password = forms.CharField(required=False)

    agree_to_terms = forms.BooleanField(required=True)

    def clean_password(self):
        password = self.cleaned_data['password']
        if password:
            validate_password(password)
        return password

    def clean_phone_number(self):
        phone_number = self.cleaned_data['phone_number']
        if JustfixUser.objects.filter(phone_number=phone_number).exists():
            # TODO: Are we leaking valuable PII here?
            raise ValidationError('A user with that phone number already exists.')
        return phone_number

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise ValidationError('Passwords do not match!')
