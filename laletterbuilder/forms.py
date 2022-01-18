from django import forms
from .models import LETTER_TYPE_CHOICES


class ChooseLetterForm(forms.Form):
    letter_type = forms.ChoiceField(
        choices=LETTER_TYPE_CHOICES.choices,
        required=True,
        help_text=("The type of letter the tenant is creating in this session."),
    )
