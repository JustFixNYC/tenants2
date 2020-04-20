from django import forms

from project.util.mailing_address import (
    US_STATE_CHOICES, ZipCodeValidator)
from project.util.phone_number import USPhoneNumberField


class TenantInfo(forms.Form):
    '''
    Corresponds to fields in our scaffolding model that
    involve tenant info.
    '''

    first_name = forms.CharField()

    last_name = forms.CharField()

    street = forms.CharField()

    city = forms.CharField()

    state = forms.ChoiceField(choices=US_STATE_CHOICES.choices)

    zip_code = forms.CharField(validators=[ZipCodeValidator()])

    apt_number = forms.CharField()

    email = forms.EmailField()

    phone_number = USPhoneNumberField()


class LandlordInfo(forms.Form):
    '''
    Corresponds to fields in our scaffolding model that
    involve landlord info.
    '''

    landlord_name = forms.CharField()

    # e.g. "666 FIFTH AVENUE, APT 2"
    landlord_primary_line = forms.CharField()

    landlord_city = forms.CharField()

    landlord_state = forms.ChoiceField(choices=US_STATE_CHOICES.choices)

    landlord_zip_code = forms.CharField()

    landlord_email = forms.EmailField(required=False)

    landlord_phone_number = USPhoneNumberField(required=False)


class FullName(forms.Form):
    first_name = forms.CharField()

    last_name = forms.CharField()


class CityState(forms.Form):
    city = forms.CharField()

    state = forms.ChoiceField(choices=US_STATE_CHOICES.choices)


class NationalAddress(forms.Form):
    street = forms.CharField()

    apt_number = forms.CharField()

    zip_code = forms.CharField(validators=[ZipCodeValidator()])
