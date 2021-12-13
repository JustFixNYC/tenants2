from django import forms
from .models import LaLetterDetails


class ChooseLetterTypeForm(forms.ModelForm):
    class Meta:
        model = LaLetterDetails
        fields = ("letter_type",)

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data
