from django import forms

class RhForm(forms.Form):
    first_name = forms.CharField()