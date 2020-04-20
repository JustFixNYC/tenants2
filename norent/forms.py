from django import forms

from project.forms import UniqueEmailForm
from project.util.mailing_address import (
    US_STATE_CHOICES, ZipCodeValidator, CITY_KWARGS)
from project.util.address_form_fields import (
    ADDRESS_FIELD_KWARGS)
from project.util.phone_number import USPhoneNumberField
from onboarding.models import APT_NUMBER_KWARGS
from users.models import JustfixUser


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


class FullName(forms.ModelForm):
    class Meta:
        model = JustfixUser
        fields = ('first_name', 'last_name')


class CityState(forms.Form):
    city = forms.CharField(**CITY_KWARGS)

    state = forms.ChoiceField(choices=US_STATE_CHOICES.choices)


class NationalAddress(forms.Form):
    street = forms.CharField(**ADDRESS_FIELD_KWARGS)

    apt_number = forms.CharField(**APT_NUMBER_KWARGS)

    zip_code = forms.CharField(validators=[ZipCodeValidator()])


class Email(UniqueEmailForm):
    pass
