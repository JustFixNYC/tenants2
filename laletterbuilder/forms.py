from django import forms
from .models import LaLetterDetails


class ChooseLetterForm(forms.ModelForm):
    class Meta:
        model = LaLetterDetails
        fields = ("letter_type",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["letter_type"].required = True

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data
