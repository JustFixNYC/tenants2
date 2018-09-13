import datetime
from typing import List
from django import forms
from django.core.exceptions import ValidationError

from . import models


class AccessDatesForm(forms.Form):
    NUM_DATE_FIELDS = 3

    date_1 = forms.DateField(required=True)

    date_2 = forms.DateField(required=False)

    date_3 = forms.DateField(required=False)

    def clean(self):
        dates = self.get_cleaned_dates(super().clean())
        if len(dates) != len(set(dates)):
            raise ValidationError('Please ensure all the dates are different.')

    def get_cleaned_dates(self, cleaned_data=None) -> List[datetime.date]:
        if cleaned_data is None:
            cleaned_data = self.cleaned_data
        result = []
        for i in range(self.NUM_DATE_FIELDS):
            date = cleaned_data.get(f'date_{i + 1}')
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
