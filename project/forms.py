from typing import Optional
from django import forms
from django.forms import ValidationError
from django.contrib.auth import authenticate

from users.models import PHONE_NUMBER_LEN, JustfixUser


class OnboardingStep1Form(forms.Form):
    name = forms.CharField(max_length=100)

    address = forms.CharField(max_length=200)

    apt_number = forms.CharField(max_length=10)


class LoginForm(forms.Form):
    phone_number = forms.CharField(max_length=PHONE_NUMBER_LEN)

    password = forms.CharField()

    # This will be set to a valid user once is_valid() returns True.
    authenticated_user: Optional[JustfixUser] = None

    def clean(self):
        cleaned_data = super().clean()
        phone_number = cleaned_data.get('phone_number')
        password = cleaned_data.get('password')

        if phone_number and password:
            user = authenticate(phone_number=phone_number, password=password)
            if user is None:
                raise ValidationError('Invalid phone number or password.',
                                      code='authenticate_failed')
            self.authenticated_user = user
