from django import forms
from django.forms import ValidationError
from django.utils.translation import gettext as _

from project.forms import (
    OptionalUniqueEmailForm,
    SetPasswordForm,
    YesNoRadiosField,
    UniqueEmailForm,
)
from project.util.phone_number import USPhoneNumberField
from project.util.address_form_fields import AddressAndBoroughFormMixin
from project.util.site_util import SITE_CHOICES
from users.models import JustfixUser
from .models import OnboardingInfo, APT_NUMBER_KWARGS


# Whenever we change the fields in any of the onboarding
# forms, we should increment this number to ensure that we
# never use an old session's onboarding data with the
# new validation logic. The downside is that the old
# session's onboarding data will disappear, but hopefully
# we won't have to do this often.
# As an alternative to incrementing this, consider migrating
# old data schemas instead using migrate_dict in
# onboarding/schema.py.
FIELD_SCHEMA_VERSION = 4


class AptNumberWithConfirmationForm(forms.Form):
    """
    This mixin can be used to gather the user's apartment number, but
    accounts for the use case where the user may *forget* to
    enter one, while also accomodating users who don't have an
    apartment number.

    This is done by providing two fields: one field for the apartment
    number, and another "I have no apartment number" checkbox. Either
    the checkbox must be checked or the field must be filled.

    Notably, the `cleaned_data` dict of this form contains *only* the
    apartment number: it will be either an empty string, if the user marked
    the checkbox, or have a filled-in value.
    """

    apt_number = forms.CharField(**APT_NUMBER_KWARGS, required=False)

    no_apt_number = forms.BooleanField(required=False)

    def clean(self):
        cleaned_data = super().clean()

        apt_number = cleaned_data.get("apt_number")

        no_apt_number = cleaned_data.get("no_apt_number")

        if apt_number and no_apt_number:
            raise ValidationError(
                _(
                    "Please either provide an apartment number or check the "
                    '"I have no apartment number" checkbox (but not both).'
                )
            )

        if not apt_number and not no_apt_number:
            raise ValidationError(
                _(
                    "Please either provide an apartment number or check the "
                    '"I have no apartment number" checkbox.'
                )
            )

        if "no_apt_number" in cleaned_data:
            cleaned_data.pop("no_apt_number")

        return cleaned_data


class NycAddressForm(AptNumberWithConfirmationForm, AddressAndBoroughFormMixin):
    pass


class OnboardingStep1Form(AptNumberWithConfirmationForm, AddressAndBoroughFormMixin):
    first_name = forms.CharField(max_length=30)

    last_name = forms.CharField(max_length=150)


class OnboardingStep1V2Form(OnboardingStep1Form):
    preferred_first_name = forms.CharField(
        max_length=150,
        required=False,
        help_text=(
            "The first name Justfix will call the user by. Optional. May be different from "
            "their legal first name."
        ),
    )


def get_boolean_field(name: str):
    """
    Django's ModelForm represents boolean fields w/ nulls as a
    forms.NullBooleanField, but because some of our fields were
    originally non-nullable, they were represented as forms.BooleanField.

    This is a helper to allow some of our currently nullable model fields
    to still be represented in a form as being non-nullable.
    """

    field = OnboardingInfo._meta.get_field(name)
    return forms.BooleanField(help_text=field.help_text, required=False)


class LeaseTypeForm(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("lease_type",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["lease_type"].required = True


class OnboardingStep3Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("lease_type", "receives_public_assistance")

    receives_public_assistance = YesNoRadiosField(
        help_text=OnboardingInfo._meta.get_field("receives_public_assistance").help_text
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["lease_type"].required = True


class ReliefAttemptsForm(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("has_called_311",)

    has_called_311 = YesNoRadiosField(
        help_text=OnboardingInfo._meta.get_field("has_called_311").help_text
    )


class PublicAssistanceForm(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("receives_public_assistance",)

    receives_public_assistance = YesNoRadiosField(
        help_text=OnboardingInfo._meta.get_field("receives_public_assistance").help_text
    )


class BaseOnboardingStep4Form(SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("can_we_sms", "signup_intent")

    phone_number = USPhoneNumberField()

    agree_to_terms = forms.BooleanField(required=True)

    def clean_phone_number(self):
        phone_number = self.cleaned_data["phone_number"]
        if JustfixUser.objects.filter(phone_number=phone_number).exists():
            # TODO: Are we leaking valuable PII here?
            raise ValidationError(
                "A user with that phone number already exists.", code="PHONE_NUMBER_TAKEN"
            )
        return phone_number


class OnboardingStep4FormVersion2(BaseOnboardingStep4Form, UniqueEmailForm):
    pass


class OnboardingStep4WithOptionalEmailForm(BaseOnboardingStep4Form, OptionalUniqueEmailForm):
    pass


class AgreeToTermsForm(forms.Form):
    agree_to_terms = forms.BooleanField(
        required=True,
        help_text=(
            "Whether the user agrees to the terms of the site's terms of " "use and privacy policy."
        ),
    )

    site = forms.ChoiceField(
        choices=SITE_CHOICES.choices,
        required=True,
        help_text=(
            "The site for which the user is agreeing to the terms of use and " "privacy policy."
        ),
    )
