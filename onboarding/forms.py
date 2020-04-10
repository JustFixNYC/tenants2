from django import forms
from django.forms import ValidationError

from project.forms import SetPasswordForm, OptionalSetPasswordForm, YesNoRadiosField
from project.util.phone_number import USPhoneNumberField
from project.util.address_form_fields import AddressAndBoroughFormMixin
from users.models import JustfixUser
from .models import OnboardingInfo


# Whenever we change the fields in any of the onboarding
# forms, we should change this number to ensure that we
# never use an old session's onboarding data with the
# new validation logic. The downside is that the old
# session's onboarding data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 4


class OnboardingStep1Form(AddressAndBoroughFormMixin, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('apt_number',)

    first_name = forms.CharField(max_length=30)

    last_name = forms.CharField(max_length=150)


def get_boolean_field(name: str):
    '''
    Django's ModelForm represents boolean fields w/ nulls as a
    forms.NullBooleanField, but because some of our fields were
    originally non-nullable, they were represented as forms.BooleanField.

    This is a helper to allow some of our currently nullable model fields
    to still be represented in a form as being non-nullable.
    '''

    field = OnboardingInfo._meta.get_field(name)
    return forms.BooleanField(help_text=field.help_text, required=False)


class OnboardingStep2Form(forms.Form):
    is_in_eviction = get_boolean_field('is_in_eviction')
    needs_repairs = get_boolean_field('needs_repairs')
    has_no_services = get_boolean_field('has_no_services')
    has_pests = get_boolean_field('has_pests')
    has_called_311 = get_boolean_field('has_called_311')


class OnboardingStep3Form(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('lease_type', 'receives_public_assistance')

    receives_public_assistance = YesNoRadiosField(
        help_text=OnboardingInfo._meta.get_field('receives_public_assistance').help_text
    )


class ReliefAttemptsForm(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('has_called_311',)

    has_called_311 = YesNoRadiosField(
        help_text=OnboardingInfo._meta.get_field('has_called_311').help_text
    )


class BaseOnboardingStep4Form(forms.Form):
    phone_number = USPhoneNumberField()

    agree_to_terms = forms.BooleanField(required=True)

    def clean_phone_number(self):
        phone_number = self.cleaned_data['phone_number']
        if JustfixUser.objects.filter(phone_number=phone_number).exists():
            # TODO: Are we leaking valuable PII here?
            raise ValidationError('A user with that phone number already exists.')
        return phone_number


class OnboardingStep4Form(BaseOnboardingStep4Form, OptionalSetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('can_we_sms', 'signup_intent')


class OnboardingStep4FormVersion2(BaseOnboardingStep4Form, SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ('can_we_sms', 'signup_intent')

    email = forms.EmailField()

    def clean_email(self):
        email = self.cleaned_data['email']
        if JustfixUser.objects.filter(email=email).exists():
            # TODO: Are we leaking valuable PII here?
            raise ValidationError('A user with that email address already exists.')
        return email
