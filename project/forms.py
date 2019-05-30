from typing import Optional
from django import forms
from django.forms import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password

from users.models import PHONE_NUMBER_LEN, JustfixUser, validate_phone_number
from . import password_reset


class YesNoRadiosField(forms.ChoiceField):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, choices=[
            (True, 'Yes'),
            (False, 'No')
        ])


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


class PasswordResetForm(forms.Form):
    '''
    Allows users to enter their phone number so they can be texted a
    code that will allow them to reset their password.
    '''

    phone_number = USPhoneNumberField()


class PasswordResetVerificationCodeForm(forms.Form):
    '''
    Allows the user to enter the verification code sent to them
    over SMS.
    '''

    code = forms.CharField(
        min_length=password_reset.VCODE_LENGTH,
        max_length=password_reset.VCODE_LENGTH
    )


class SetPasswordForm(forms.Form):
    '''
    A form that can be used to set a password. It can also
    be used as a mixin.
    '''

    password = forms.CharField()

    confirm_password = forms.CharField()

    def clean_password(self):
        password = self.cleaned_data['password']
        if password:
            validate_password(password)
        return password

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get('password')
        confirm_password = cleaned_data.get('confirm_password')

        if password and confirm_password and password != confirm_password:
            raise ValidationError('Passwords do not match!')


class OptionalSetPasswordForm(SetPasswordForm):
    '''
    A form that can be used to *optionally* set a password. It can also
    be used as a mixin.
    '''

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password'].required = False
        self.fields['confirm_password'].required = False


class ExampleRadioForm(forms.Form):
    radio_field = forms.ChoiceField(choices=[('A', 'a'), ('B', 'b')])


class ExampleForm(forms.Form):
    example_field = forms.CharField(max_length=5)

    bool_field = forms.BooleanField(required=False)

    example_other_field = forms.CharField(max_length=10, required=False)

    currency_field = forms.DecimalField(max_digits=10, decimal_places=2)


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
                raise forms.ValidationError('This is an example non-form error!',
                                            code='CODE_NFOER')


class ExampleSubform(forms.Form):
    example_field = forms.CharField(max_length=5)

    def clean(self):
        cleaned_data = super().clean()

        if cleaned_data.get('example_field') == 'NFIER':
            # This is used during manual and automated tests to
            # ensure that non-field errors work in formsets.
            raise ValidationError('This is an example non-field error!')
