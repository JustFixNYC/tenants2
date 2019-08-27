import datetime
from typing import List
import pydantic
from django import forms
from django.core.exceptions import ValidationError

from . import models
from project import common_data


class AccessDatesValidation(pydantic.BaseModel):
    MIN_DAYS: int
    MIN_DAYS_TEXT: str


class AccessDatesForm(forms.Form):
    # On the client-side, we auto-fill the first date as being MIN_DAYS
    # from today, but we don't want to deny it on the server when it's
    # close to midnight, or due to time zone mismatch issues, so
    # in reality we'll allow for a bit of leeway.
    MIN_DAYS_LEEWAY = datetime.timedelta(days=1)

    NUM_DATE_FIELDS = 3

    date1 = forms.DateField(required=True)

    date2 = forms.DateField(required=False)

    date3 = forms.DateField(required=False)

    def clean(self):
        dates = self.get_cleaned_dates(super().clean())
        if len(dates) != len(set(dates)):
            raise ValidationError('Please ensure all the dates are different.')
        self._validate_minimum_dates(dates)

    def _validate_minimum_dates(self, dates: List[datetime.date]):
        cfg = AccessDatesValidation(**common_data.load_json('access-dates-validation.json'))
        today = datetime.date.today() - self.MIN_DAYS_LEEWAY
        for date in dates:
            if (date - today).days < cfg.MIN_DAYS:
                raise ValidationError(
                    f'Please ensure all dates are at least {cfg.MIN_DAYS_TEXT} from today.')

    def get_cleaned_dates(self, cleaned_data=None) -> List[datetime.date]:
        if cleaned_data is None:
            cleaned_data = self.cleaned_data
        result = []
        for i in range(self.NUM_DATE_FIELDS):
            date = cleaned_data.get(f'date{i + 1}')
            if date is not None:
                result.append(date)
        return result


class LandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = models.LandlordDetails
        fields = ('name', 'address')


class LetterRequestForm(forms.ModelForm):
    class Meta:
        model = models.LetterRequest
        fields = ('mail_choice',)

    def clean(self):
        super().clean()
        self.instance.regenerate_html_content(author='the user')


class EmailForm(forms.Form):
    email = forms.EmailField()
