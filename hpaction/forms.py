from typing import Optional
from django import forms
from django.core.exceptions import ValidationError

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


class TenantChildForm(forms.ModelForm):
    class Meta:
        model = models.TenantChild
        fields = ['name', 'dob']


class PreviousAttemptsForm(forms.ModelForm):
    class Meta:
        model = models.HPActionDetails
        fields = [
            'filed_with_311',
            'thirty_days_since_311',
            'hpd_issued_violations',
            'thirty_days_since_violations'
        ]

    filed_with_311 = YesNoRadiosField()
    thirty_days_since_311 = YesNoRadiosField(required=False)
    hpd_issued_violations = YesNoRadiosField(required=False)
    thirty_days_since_violations = YesNoRadiosField(required=False)

    def add_dynamically_required_error(self, field: str):
        msg = forms.Field.default_error_messages['required']
        self.add_error(field, ValidationError(msg, code='required'))

    def require_bool_field(self, field: str, cleaned_data) -> Optional[bool]:
        value = cleaned_data.get(field)
        if value is None:
            self.add_dynamically_required_error(field)
        else:
            assert isinstance(value, bool)
        return value

    def clean(self):
        cleaned_data = super().clean()

        if cleaned_data.get('filed_with_311') is True:
            hpd_issued_violations = self.require_bool_field(
                'hpd_issued_violations', cleaned_data)
            if hpd_issued_violations is False:
                self.require_bool_field('thirty_days_since_311', cleaned_data)
            elif hpd_issued_violations is True:
                self.require_bool_field('thirty_days_since_violations', cleaned_data)

        return cleaned_data


class GeneratePDFForm(forms.Form):
    pass
