from typing import Optional
from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

from project.forms import YesNoRadiosField
from onboarding.models import OnboardingInfo
from . import models


class FeeWaiverIncomeForm(forms.ModelForm):
    class Meta:
        model = models.FeeWaiverDetails
        fields = [
            'income_amount_monthly',
            'income_src_employment',
            'income_src_hra',
            'income_src_child_support',
            'income_src_alimony',
            'income_src_social_security',
            'income_src_other',
        ]


class FeeWaiverExpensesForm(forms.ModelForm):
    class Meta:
        model = models.FeeWaiverDetails
        fields = [
            'rent_amount',
            'expense_utilities',
            'expense_cable',
            'expense_phone',
            'expense_childcare',
            'expense_other',
        ]


class FeeWaiverMiscForm(forms.ModelForm):
    class Meta:
        model = models.FeeWaiverDetails
        fields = ['asked_before']

    asked_before = YesNoRadiosField()


class FeeWaiverPublicAssistanceForm(forms.ModelForm):
    class Meta:
        model = models.FeeWaiverDetails
        fields = ['receives_public_assistance']

    receives_public_assistance = YesNoRadiosField()


class AccessForInspectionForm(forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ['floor_number']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['floor_number'].required = True


class PriorCaseForm(forms.ModelForm):
    class Meta:
        model = models.PriorCase
        fields = ['case_number', 'case_date', 'is_harassment', 'is_repairs']


class TenantChildForm(forms.ModelForm):
    class Meta:
        model = models.TenantChild
        fields = ['name', 'dob']


FILED_WITH_311 = 'filed_with_311'
THIRTY_DAYS_SINCE_311 = 'thirty_days_since_311'
HPD_ISSUED_VIOLATIONS = 'hpd_issued_violations'
THIRTY_DAYS_SINCE_VIOLATIONS = 'thirty_days_since_violations'


class UrgentAndDangerousForm(forms.ModelForm):
    class Meta:
        model = models.HPActionDetails
        fields = [
            'urgent_and_dangerous'
        ]

    urgent_and_dangerous = YesNoRadiosField()


def ensure_at_least_one_is_true(cleaned_data):
    true_fields = [True for value in cleaned_data.values() if value is True]
    if not true_fields:
        raise ValidationError("Please choose at least one option.")
    return cleaned_data


class SueForm(forms.ModelForm):
    class Meta:
        model = models.HPActionDetails
        fields = [
            'sue_for_repairs',
            'sue_for_harassment',
        ]

    sue_for_repairs = forms.BooleanField(required=False)
    sue_for_harassment = forms.BooleanField(required=False)

    def clean(self):
        return ensure_at_least_one_is_true(super().clean())


class DynamicallyRequiredBoolMixin:
    def add_dynamically_required_error(self, field: str):
        msg = forms.Field.default_error_messages['required']
        self.add_error(field, ValidationError(msg, code='required'))  # type: ignore

    def require_bool_field(self, field: str, cleaned_data) -> Optional[bool]:
        value = YesNoRadiosField.coerce(cleaned_data.get(field))
        if value is None:
            self.add_dynamically_required_error(field)
        else:
            assert isinstance(value, bool)
        return value


class PreviousAttemptsForm(DynamicallyRequiredBoolMixin, forms.ModelForm):
    class Meta:
        model = models.HPActionDetails
        fields = [
            FILED_WITH_311,
            THIRTY_DAYS_SINCE_311,
            HPD_ISSUED_VIOLATIONS,
            THIRTY_DAYS_SINCE_VIOLATIONS,
        ]

    filed_with_311 = YesNoRadiosField()
    thirty_days_since_311 = YesNoRadiosField(required=False)
    hpd_issued_violations = YesNoRadiosField(required=False)
    thirty_days_since_violations = YesNoRadiosField(required=False)

    def clean(self):
        cleaned_data = super().clean()
        filed_with_311 = YesNoRadiosField.coerce(cleaned_data.get(FILED_WITH_311))

        if filed_with_311 is True:
            hpd_issued_violations = self.require_bool_field(
                HPD_ISSUED_VIOLATIONS, cleaned_data)
            if hpd_issued_violations is False:
                self.require_bool_field(THIRTY_DAYS_SINCE_311, cleaned_data)
                cleaned_data[THIRTY_DAYS_SINCE_VIOLATIONS] = ''
            elif hpd_issued_violations is True:
                self.require_bool_field(THIRTY_DAYS_SINCE_VIOLATIONS, cleaned_data)
                cleaned_data[THIRTY_DAYS_SINCE_311] = ''
        elif filed_with_311 is False:
            cleaned_data[HPD_ISSUED_VIOLATIONS] = ''
            cleaned_data[THIRTY_DAYS_SINCE_311] = ''
            cleaned_data[THIRTY_DAYS_SINCE_VIOLATIONS] = ''

        return cleaned_data


TWO_OR_LESS_APARTMENTS_IN_BUILDING = 'two_or_less_apartments_in_building'
MORE_THAN_ONE_FAMILY_PER_APARTMENT = 'more_than_one_family_per_apartment'


class HarassmentApartmentForm(DynamicallyRequiredBoolMixin, forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            TWO_OR_LESS_APARTMENTS_IN_BUILDING,
            MORE_THAN_ONE_FAMILY_PER_APARTMENT,
        ]

    two_or_less_apartments_in_building = YesNoRadiosField()
    more_than_one_family_per_apartment = YesNoRadiosField(required=False)

    def clean(self):
        cleaned_data = super().clean()
        two_or_less = YesNoRadiosField.coerce(cleaned_data.get(TWO_OR_LESS_APARTMENTS_IN_BUILDING))

        if two_or_less is True:
            self.require_bool_field(MORE_THAN_ONE_FAMILY_PER_APARTMENT, cleaned_data)
        elif two_or_less is False:
            cleaned_data[MORE_THAN_ONE_FAMILY_PER_APARTMENT] = ''

        return cleaned_data


class HarassmentAllegations1Form(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'alleg_force',
            'alleg_misleading_info',
            'alleg_stopped_service',
            'alleg_failed_to_comply',
            'alleg_false_cert_repairs',
            'alleg_conduct_in_violation',
            'alleg_sued',
        ]


class HarassmentAllegations2Form(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'alleg_removed_possessions',
            'alleg_induced_leaving',
            'alleg_contact',
            'alleg_threats_re_status',
            'alleg_requested_id',
            'alleg_disturbed'
        ]


class HarassmentExplainForm(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'harassment_details',
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['harassment_details'].required = True


class GeneratePDFForm(forms.Form):
    pass


class EmergencyHPAIssuesForm(forms.Form):
    no_heat = forms.BooleanField(required=False)
    no_hot_water = forms.BooleanField(required=False)

    def clean(self):
        return ensure_at_least_one_is_true(super().clean())


class BeginDocusignForm(forms.Form):
    next_url = forms.CharField(validators=[RegexValidator(
        regex=r"^\/.*",
        message="The URL must start with '/'."
    )])
