from typing import Optional
from django import forms
from django.forms import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _

from users.models import JustfixUser
from project.util.phone_number import USPhoneNumberField
from project.util.form_with_request import FormWithRequestMixin
from . import password_reset


CHOOSE_ONE_MSG = _("Please choose at least one option.")


def ensure_at_least_one_is_true(cleaned_data):
    """
    A helper for forms that ensures that at least one of the values
    in the given cleaned data dict is True.
    """

    true_fields = [True for value in cleaned_data.values() if value is True]
    if not true_fields:
        raise ValidationError(CHOOSE_ONE_MSG)
    return cleaned_data


class YesNoRadiosField(forms.ChoiceField):
    # Choice when a user selects "yes" from a yes/no radio (specific to Django).
    TRUE = "True"

    # Choice when a user selects "no" from a yes/no radio (specific to Django).
    FALSE = "False"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs, choices=[(True, "Yes"), (False, "No")])

    @classmethod
    def coerce(cls, value: Optional[str]) -> Optional[bool]:
        if value in cls.empty_values:
            return None
        if value == cls.TRUE:
            return True
        if value == cls.FALSE:
            return False
        raise ValueError(f"Invalid YesNoRadiosField value: {value}")

    @classmethod
    def reverse_coerce_to_str(cls, value: Optional[bool]) -> str:
        if value is None:
            return ""
        if value is True:
            return cls.TRUE
        assert value is False
        return cls.FALSE


class DynamicallyRequiredFieldsMixin:
    def add_dynamically_required_error(self, field: str):
        msg = forms.Field.default_error_messages["required"]
        self.add_error(field, ValidationError(msg, code="required"))  # type: ignore

    def require_bool_field(self, field: str, cleaned_data) -> Optional[bool]:
        value = YesNoRadiosField.coerce(cleaned_data.get(field))
        if value is None:
            self.add_dynamically_required_error(field)
        else:
            assert isinstance(value, bool)
        return value

    def require_text_field(self, field: str, cleaned_data) -> Optional[str]:
        value = cleaned_data.get(field, "")
        if not value:
            self.add_dynamically_required_error(field)
        else:
            assert isinstance(value, str)
        return value


class LoginForm(forms.Form):
    phone_number = USPhoneNumberField()

    password = forms.CharField()

    # This will be set to a valid user once is_valid() returns True.
    authenticated_user: Optional[JustfixUser] = None

    def clean(self):
        cleaned_data = super().clean()
        phone_number = cleaned_data.get("phone_number")
        password = cleaned_data.get("password")

        if phone_number and password:
            user = authenticate(phone_number=phone_number, password=password)
            if user is None:
                raise ValidationError(
                    _("Invalid phone number or password."), code="authenticate_failed"
                )
            self.authenticated_user = user


class LogoutForm(forms.Form):
    """
    This is a pretty pointless form, but our current architecture makes it
    a lot easier to log out this way.
    """

    pass


class PasswordResetForm(forms.Form):
    """
    Allows users to enter their phone number so they can be texted a
    code that will allow them to reset their password.
    """

    phone_number = USPhoneNumberField()


class PasswordResetVerificationCodeForm(forms.Form):
    """
    Allows the user to enter the verification code sent to them
    over SMS.
    """

    code = forms.CharField(
        min_length=password_reset.VCODE_LENGTH, max_length=password_reset.VCODE_LENGTH
    )


class UniqueEmailForm(forms.Form, FormWithRequestMixin):
    """
    A form with an email field that makes sure the provided email address
    isn't already taken by another user.
    """

    email = forms.EmailField()

    def clean_email(self):
        email = self.cleaned_data["email"]
        if self.request and self.request.user.is_authenticated and self.request.user.email == email:
            # The passed-in email is already the current user's email, don't worry about it.
            return email
        # We also want to make sure email is filled out, in case a subclass of ours made
        # it optional.
        if email and JustfixUser.objects.filter(email=email).exists():
            # TODO: Are we leaking valuable PII here?
            raise ValidationError(
                _("A user with that email address already exists."), code="EMAIL_ADDRESS_TAKEN"
            )
        return email


class OptionalUniqueEmailForm(UniqueEmailForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"].required = False


class SetPasswordForm(forms.Form):
    """
    A form that can be used to set a password. It can also
    be used as a mixin.
    """

    password = forms.CharField()

    confirm_password = forms.CharField()

    def clean_password(self):
        password = self.cleaned_data["password"]
        if password:
            validate_password(password)
        return password

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password and confirm_password and password != confirm_password:
            raise ValidationError(_("Passwords do not match!"))


class PhoneNumberForm(forms.Form):
    phone_number = USPhoneNumberField()


class ExampleRadioForm(forms.Form):
    radio_field = forms.ChoiceField(choices=[("A", "a"), ("B", "b")])


class ExampleForm(forms.Form):
    example_field = forms.CharField(max_length=5)

    bool_field = forms.BooleanField(required=False)

    example_other_field = forms.CharField(max_length=10, required=False)

    currency_field = forms.DecimalField(max_digits=10, decimal_places=2)

    field_to_ignore = forms.CharField(required=False)


class ExampleSubformFormset(forms.BaseFormSet):
    def clean(self):
        if any(self.errors):
            # Don't bother validating the formset unless
            # each form is valid on its own.
            return
        for form in self.forms:
            if form.cleaned_data["example_field"] == "NFOER":
                # This is used during manual and automated
                # tests to ensure that non-form errors work
                # in formsets.
                raise forms.ValidationError("This is an example non-form error!", code="CODE_NFOER")


class ExampleSubform(forms.Form):
    example_field = forms.CharField(max_length=5)

    def clean(self):
        cleaned_data = super().clean()

        if cleaned_data.get("example_field") == "NFIER":
            # This is used during manual and automated tests to
            # ensure that non-field errors work in formsets.
            raise ValidationError("This is an example non-field error!")
