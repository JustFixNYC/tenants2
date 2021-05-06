from typing import List, Optional, Tuple
from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from project.forms import (
    OptionalUniqueEmailForm,
    SetPasswordForm,
    UniqueEmailForm,
    ensure_at_least_one_is_true,
)
from project.util.mailing_address import US_STATE_CHOICES, ZipCodeValidator, CITY_KWARGS
from project.util.address_form_fields import ADDRESS_FIELD_KWARGS
from project import mapbox
from loc.models import LandlordDetails
from loc.lob_api import MAX_NAME_LEN as MAX_LOB_NAME_LEN
from onboarding.models import OnboardingInfo
from onboarding.forms import AptNumberWithConfirmationForm
from users.models import JustfixUser
from .models import RentPeriod, CityWithoutStateDiagnostic


class FullLegalName(forms.ModelForm):
    class Meta:
        model = JustfixUser
        fields = ("first_name", "last_name")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["first_name"].required = True
        self.fields["last_name"].required = True


class CityState(forms.Form):
    city = forms.CharField(**CITY_KWARGS)

    state = forms.ChoiceField(choices=US_STATE_CHOICES.choices)

    def validate_city_and_state(
        self, city: str, state: str
    ) -> Tuple[str, Optional[Tuple[float, float]]]:
        cities = mapbox.find_city(city, state)
        if cities is None:
            # Mapbox is disabled or a network error occurred.
            return (city, None)
        if len(cities) == 0:
            state_name = US_STATE_CHOICES.get_label(state)
            raise ValidationError(
                _("%(city)s, %(state_name)s doesn't seem to exist!")
                % {
                    "city": city,
                    "state_name": state_name,
                }
            )
        return cities[0]

    def clean(self):
        cleaned_data = super().clean()
        city = cleaned_data.get("city")
        state = cleaned_data.get("state")

        if city and not state:
            CityWithoutStateDiagnostic(city=city).save()

        if city and state:
            city, point = self.validate_city_and_state(city, state)
            cleaned_data["city"] = city
            cleaned_data["lnglat"] = point

        return cleaned_data


class NationalAddress(AptNumberWithConfirmationForm):
    street = forms.CharField(**ADDRESS_FIELD_KWARGS)

    zip_code = forms.CharField(validators=[ZipCodeValidator()])


class Email(UniqueEmailForm):
    pass


class OptionalEmail(OptionalUniqueEmailForm):
    pass


class CreateAccount(SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("can_we_sms",)

    agree_to_terms = forms.BooleanField(required=True)


class LandlordNameAndContactTypes(forms.Form):
    name = forms.CharField(
        # Our model's limits are more lax than that of Lob's API, so
        # hew to Lob's limits.
        max_length=MAX_LOB_NAME_LEN,
        required=True,
        help_text=LandlordDetails._meta.get_field("name").help_text,
    )

    has_email_address = forms.BooleanField(required=False)

    has_mailing_address = forms.BooleanField(required=False)

    def clean(self):
        return ensure_at_least_one_is_true(super().clean())


class OptInToCommsForm(forms.Form):
    opt_in = forms.BooleanField(
        required=False,
        help_text=(
            "Whether the user agrees to receive communications from a " "partner organization."
        ),
    )


def get_rent_period_choices() -> List[Tuple[str, str]]:
    return [
        (iso_date, iso_date) for iso_date in RentPeriod.to_iso_date_list(RentPeriod.objects.all())
    ]


class RentPeriodsForm(forms.Form):
    rent_periods = forms.MultipleChoiceField(
        required=True,
        choices=get_rent_period_choices,
    )
