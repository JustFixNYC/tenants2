from typing import List
from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from .models import JustfixUser
from project.util.phone_number import USPhoneNumberField


class JustfixUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = JustfixUser
        fields = ("username", "phone_number")


class JustfixUserChangeForm(UserChangeForm):
    class Meta:
        model = JustfixUser
        fields = ("username", "phone_number")


class SendVerificationEmailForm(forms.Form):
    email = forms.EmailField(
        help_text=(
            "The email address of the user. If this is different from their "
            "current email address, their email address will be changed and "
            "marked as unverified."
        )
    )


class PhoneNumberForm(forms.ModelForm):
    class Meta:
        model = JustfixUser
        fields = ["phone_number"]

    phone_number = USPhoneNumberField()
