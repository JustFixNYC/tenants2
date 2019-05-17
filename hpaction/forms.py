from django import forms

from .models import FeeWaiverDetails


class FeeWaiverForm(forms.ModelForm):
    class Meta:
        model = FeeWaiverDetails
        exclude = ['user']


class GeneratePDFForm(forms.Form):
    pass
