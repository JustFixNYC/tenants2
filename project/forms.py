from typing import Optional
from django import forms
from django.forms import ValidationError
from django.contrib.auth import authenticate

from users.models import PHONE_NUMBER_LEN, JustfixUser


class USPhoneNumberField(forms.CharField):
    '''
    A field for a United States phone number.
    '''

    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 15  # Allow for extra characters, we'll remove them.
        super().__init__(*args, **kwargs)

    def clean(self, value: str) -> str:
        cleaned = super().clean(value)
        cleaned = ''.join([
            ch for ch in cleaned
            if ch in '1234567890'
        ])
        if len(cleaned) == PHONE_NUMBER_LEN + 1 and cleaned.startswith('1'):
            # The user specified the country calling code, remove it.
            cleaned = cleaned[1:]
        if len(cleaned) != PHONE_NUMBER_LEN:
            raise ValidationError(
                'This does not look like a U.S. phone number. '
                'Please include the area code, e.g. (555) 123-4567.'
            )
        return cleaned


class LoginForm(forms.Form):
    phone_number = USPhoneNumberField()

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


class LogoutForm(forms.Form):
    '''
    This is a pretty pointless form, but our current architecture makes it
    a lot easier to log out this way.
    '''

    pass


class ExampleForm(forms.Form):
    example_field = forms.CharField(max_length=5)

    bool_field = forms.BooleanField(required=False)
