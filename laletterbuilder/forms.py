from django import forms
from project import common_data

LETTER_TYPE_CHOICES = common_data.Choices.from_file("hp-action-choices.json")


class ChooseLetterTypeForm(forms.Form):

    letter_type = forms.ChoiceField(choices=LETTER_TYPE_CHOICES.choices)
