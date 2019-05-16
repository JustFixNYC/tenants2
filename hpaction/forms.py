from django import forms

from .models import FeeWaiverDetails


class FeeWaiverForm(forms.ModelForm):
    class Meta:
        model = FeeWaiverDetails
        fields = ['income_frequency']


class GeneratePDFForm(forms.Form):
    pass
