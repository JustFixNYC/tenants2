from django import forms
from django.forms import ValidationError

from project.forms import (
    USPhoneNumberField, OptionalSetPasswordForm, YesNoRadiosField)
from project.util.address_form_fields import AddressAndBoroughFormMixin
from users.models import JustfixUser
from .models import OnboardingInfo


# Whenever we change the fields in any of the onboarding
# forms, we should change this number to ensure that we
# never use an old session's onboarding data with the
# new validation logic. The downside is that the old
# session's onboarding data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 3


class OnboardingStep1Form(AddressAndBoroughFormMixin, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('apt_number',)

    first_name = forms.CharField(max_length=30)

    last_name = forms.CharField(max_length=150)


class OnboardingStep2Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = (
            'is_in_eviction', 'needs_repairs', 'has_no_services',
            'has_pests', 'has_called_311'
        )


class OnboardingStep3Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('lease_type', 'receives_public_assistance')

    receives_public_assistance = YesNoRadiosField(
        help_text=OnboardingInfo._meta.get_field('receives_public_assistance').help_text
    )


class OnboardingStep4Form(OptionalSetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('can_we_sms', 'signup_intent')

    phone_number = USPhoneNumberField()

    agree_to_terms = forms.BooleanField(required=True)

    def clean_phone_number(self):
        phone_number = self.cleaned_data['phone_number']
        if JustfixUser.objects.filter(phone_number=phone_number).exists():
            # TODO: Are we leaking valuable PII here?
            raise ValidationError('A user with that phone number already exists.')
        return phone_number
