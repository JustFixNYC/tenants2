from django import forms

from project.forms import YesNoRadiosField
from .models import FeeWaiverDetails


class FeeWaiverForm(forms.ModelForm):
    class Meta:
        model = FeeWaiverDetails
        exclude = ['user']

    asked_before = YesNoRadiosField()


class GeneratePDFForm(forms.Form):
    pass
