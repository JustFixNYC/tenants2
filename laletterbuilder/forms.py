import datetime
from typing import List
import pydantic
from django import forms
from django.core.exceptions import ValidationError
from laletterbuilder.models import LA_ISSUE_CHOICES
from loc import models as loc_models

from loc.forms import validate_non_stupid_name
from onboarding.models import OnboardingInfo
from project.forms import SetPasswordForm
from project.util import lob_api
from project import common_data


class CreateAccount(SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("can_we_sms",)

    agree_to_terms = forms.BooleanField(required=True)
    email = forms.EmailField(required=False)


class LandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = loc_models.LandlordDetails
        fields = (
            "name",
            "primary_line",
            "city",
            "state",
            "zip_code",
            "email",
        )

    name = forms.CharField(
        # Our model's limits are more lax than that of Lob's API, so
        # hew to Lob's limits.
        max_length=lob_api.MAX_NAME_LEN,
        required=True,
        validators=[validate_non_stupid_name],
        help_text=loc_models.LandlordDetails._meta.get_field("name").help_text,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in ["name", "primary_line", "city", "state", "zip_code"]:
            self.fields[field].required = True


class HabitabilityIssuesForm(forms.Form):

    la_issues = forms.MultipleChoiceField(
        required=False,
        choices=LA_ISSUE_CHOICES.choices,
        help_text=("The issues to set. Any issues not listed will be removed."),
    )


class LaAccessDatesValidation(pydantic.BaseModel):
    MIN_DAYS: int


class LaAccessDatesForm(forms.Form):
    # On the client-side, we auto-fill the first date as being MIN_DAYS
    # from today, but we don't want to deny it on the server when it's
    # close to midnight, or due to time zone mismatch issues, so
    # in reality we'll allow for a bit of leeway.
    MIN_DAYS_LEEWAY = datetime.timedelta(days=1)

    NUM_DATE_FIELDS = 3

    date1 = forms.DateField(required=True)

    date2 = forms.DateField(required=False)

    date3 = forms.DateField(required=False)

    start_time1 = forms.TimeField(required=False)
    # end_time1 = forms.TimeField(required=True)

    # start_time2 = forms.TimeField(required=False)
    # end_time2 = forms.TimeField(required=False)

    # start_time3 = forms.TimeField(required=False)
    # end_time3 = forms.TimeField(required=False)

    def clean(self):
        dates = self.get_cleaned_dates(super().clean())
        # times = self.get_cleaned_times(super().clean())
        # TODO: figure out with new structure - set of two times
        if len(dates) != len(set(dates)):
            raise ValidationError("Please ensure all the dates are different.")
        self._validate_minimum_dates(dates)

    def _validate_minimum_dates(self, dates: List[datetime.date]):
        cfg = LaAccessDatesValidation(**common_data.load_json("access-dates-validation.json"))
        today = datetime.date.today() - self.MIN_DAYS_LEEWAY
        for date in dates:
            if (date - today).days < cfg.MIN_DAYS:
                raise ValidationError(
                    f"Please ensure all dates are at least {cfg.MIN_DAYS} days from today."
                )

    # TODO: we might need a get cleaned dates_and_times method so there is only one called in schema.py 
    # and we'll want to validate relationships between both
    def get_cleaned_dates(self, cleaned_data=None) -> List[datetime.date]:
        if cleaned_data is None:
            cleaned_data = self.cleaned_data
        result = []
        for i in range(self.NUM_DATE_FIELDS):
            date = cleaned_data.get(f"date{i + 1}")
            if date is not None:
                result.append(date)
        return result

    # def get_cleaned_dates_times(self, cleaned_data=None) -> List[datetime.time]:
    #     if cleaned_data is None:
    #         cleaned_data = self.cleaned_data
    #     result = []
    #     for i in range(self.NUM_DATE_FIELDS):
    #         date = cleaned_data.get(f"date{i + 1}")
    #         start_time = cleaned_data.get(f"start_time{i + 1}")
    #         end_time = cleaned_data.get(f"end_time{i + 1}")
    #         # TODO: ensure for each date there are times, end_time after start_time, etc.
    #         if date is not None:
    #             result.append(date)
    #             result.append(start_time)
    #             result.append(end_time)
    #     return result


# class LaAccessTimesForm(forms.Form):

#     start_time1 = forms.TimeField(required=True)