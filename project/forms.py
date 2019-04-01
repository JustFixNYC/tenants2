from typing import Optional
from django import forms
from django.forms import ValidationError
from django.contrib.auth import authenticate

from users.models import PHONE_NUMBER_LEN, JustfixUser, validate_phone_number


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
        validate_phone_number(cleaned)
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


class ExampleRadioForm(forms.Form):
    radio_field = forms.ChoiceField(choices=[('A', 'a'), ('B', 'b')])


class ExampleForm(forms.Form):
    example_field = forms.CharField(max_length=5)

    bool_field = forms.BooleanField(required=False)


class ExampleSubformFormset(forms.BaseFormSet):
    def clean(self):
        if any(self.errors):
            # Don't bother validating the formset unless
            # each form is valid on its own.
            return
        for form in self.forms:
            if form.cleaned_data['example_field'] == 'NFOER':
                # This is used during manual and automated
                # tests to ensure that non-form errors work
                # in formsets.
                raise forms.ValidationError('This is an example non-form error!')


class ExampleSubform(forms.Form):
    example_field = forms.CharField(max_length=5)

    def clean(self):
        cleaned_data = super().clean()

        if cleaned_data.get('example_field') == 'NFIER':
            # This is used during manual and automated tests to
            # ensure that non-field errors work in formsets.
            raise ValidationError('This is an example non-field error!')
