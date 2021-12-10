from django import forms
from .models import LALetterDetails


class ChooseLetterTypeForm(forms.ModelForm):
    class Meta:
        model = LALetterDetails
        fields = ("letter_type",)

    def clean(self):
        pass
