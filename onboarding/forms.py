from django import forms
from django.forms import ValidationError
from django.contrib.auth.password_validation import validate_password

from project import geocoding
from project.forms import USPhoneNumberField
from project.common_data import Choices
from users.models import JustfixUser


BOROUGH_CHOICES = Choices.from_file('borough-choices.json')

LEASE_CHOICES = Choices.from_file('lease-choices.json')


class OnboardingStep1Form(forms.Form):
    name = forms.CharField(max_length=100)

    address = forms.CharField(max_length=200)

    borough = forms.ChoiceField(choices=BOROUGH_CHOICES)

    apt_number = forms.CharField(max_length=10)

    def clean(self):
        cleaned_data = super().clean()
        address = cleaned_data.get('address')
        borough = cleaned_data.get('borough')
        if address and borough:
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
            cleaned_data['address'] = address
            cleaned_data['address_verified'] = address_verified
        return cleaned_data


class OnboardingStep2Form(forms.Form):
    is_in_eviction = forms.BooleanField(
        required=False,
        help_text="Has the user received an eviction notice?")

    needs_repairs = forms.BooleanField(
        required=False,
        help_text="Does the user need repairs in their apartment?")

    has_no_services = forms.BooleanField(
        required=False,
        help_text="Is the user missing essential services like water?")

    has_pests = forms.BooleanField(
        required=False,
        help_text="Does the user have pests like rodents or bed bugs?")

    has_called_311 = forms.BooleanField(
        required=False,
        help_text="Has the user called 311 before?")


class OnboardingStep3Form(forms.Form):
    lease_type = forms.ChoiceField(choices=LEASE_CHOICES)

    receives_public_assistance = forms.BooleanField(
        required=False,
        help_text="Does the user receive public assistance, e.g. Section 8?")


class OnboardingStep4Form(forms.Form):
    phone_number = USPhoneNumberField()

    can_we_sms = forms.BooleanField(required=True)

    password = forms.CharField()

    confirm_password = forms.CharField()

    def clean_password(self):
        password = self.cleaned_data['password']
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
