from django import forms
from django.core.exceptions import ValidationError

from project.forms import SetPasswordForm, UniqueEmailForm, ensure_at_least_one_is_true
from project.util.mailing_address import (
    US_STATE_CHOICES, ZipCodeValidator, CITY_KWARGS)
from project.util.address_form_fields import (
    ADDRESS_FIELD_KWARGS)
from project import mapbox
from loc.models import LandlordDetails
from onboarding.models import OnboardingInfo
from onboarding.forms import AptNumberWithConfirmationForm
from users.models import JustfixUser


class FullName(forms.ModelForm):
    class Meta:
        model = JustfixUser
        fields = ('first_name', 'last_name')


class CityState(forms.Form):
    city = forms.CharField(**CITY_KWARGS)

    state = forms.ChoiceField(choices=US_STATE_CHOICES.choices)

    def validate_city_and_state(self, city: str, state: str) -> str:
        cities = mapbox.find_city(city, state)
        if cities is None:
            # Mapbox is disabled or a network error occurred.
            return city
        if len(cities) == 0:
            state_name = US_STATE_CHOICES.get_label(state)
            raise ValidationError(f"{city}, {state_name} doesn't seem to exist!")
        return cities[0]

    def clean(self):
        cleaned_data = super().clean()
        city = cleaned_data.get('city')
        state = cleaned_data.get('state')

        if city and state:
            cleaned_data['city'] = self.validate_city_and_state(city, state)

        return cleaned_data


class NationalAddress(AptNumberWithConfirmationForm):
    street = forms.CharField(**ADDRESS_FIELD_KWARGS)

    zip_code = forms.CharField(validators=[ZipCodeValidator()])


class Email(UniqueEmailForm):
    pass


class CreateAccount(SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('can_we_sms',)

    agree_to_terms = forms.BooleanField(required=True)


class LandlordNameAndContactTypes(forms.ModelForm):
    class Meta:
        model = LandlordDetails
        fields = ('name',)

    has_email_address = forms.BooleanField(required=False)

    has_mailing_address = forms.BooleanField(required=False)

    def clean(self):
        return ensure_at_least_one_is_true(super().clean())


class OptInToRttcCommsForm(forms.Form):
    opt_in = forms.BooleanField(
        required=False,
        help_text=(
            "Whether the user agrees to receive communications from the "
            "Right to the City Alliance (RTTC)."
        )
    )
