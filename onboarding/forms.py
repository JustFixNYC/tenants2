from typing import Tuple
from django import forms
from django.forms import ValidationError
from django.contrib.auth.password_validation import validate_password

from project import geocoding
from project.forms import USPhoneNumberField
from users.models import JustfixUser
from .models import OnboardingInfo


# Whenever we change the fields in any of the onboarding
# forms, we should change this number to ensure that we
# never use an old session's onboarding data with the
# new validation logic. The downside is that the old
# session's onboarding data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 2


class OnboardingStep1Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('address', 'borough', 'apt_number')

    first_name = forms.CharField(max_length=30)

    last_name = forms.CharField(max_length=150)

    def __verify_address(self, address: str, borough: str) -> Tuple[str, bool]:
        '''
        Attempt to verify the given address, returning the address, and whether it
        was actually verified. If the address was verified, the returned address
        may have changed.
        '''

        features = geocoding.search(', '.join([address, borough]))
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
            address = features[0].properties.name
        return address, address_verified

    def clean(self):
        cleaned_data = super().clean()
        address = cleaned_data.get('address')
        borough = cleaned_data.get('borough')
        if address and borough:
            address, address_verified = self.__verify_address(address, borough)
            cleaned_data['address'] = address
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
        fields = ('can_we_sms',)

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
