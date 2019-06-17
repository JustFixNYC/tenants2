from django import forms

from project.forms import YesNoRadiosField
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


class TenantChildForm(forms.ModelForm):
    class Meta:
        model = models.TenantChild
        fields = ['name', 'dob']


class PreviousAttemptsForm(forms.ModelForm):
    class Meta:
        model = models.HPActionDetails
        exclude = ['user']

    filed_with_311 = YesNoRadiosField()
    thirty_days_since_311 = YesNoRadiosField()
    hpd_issued_violations = YesNoRadiosField()
    issues_fixed = YesNoRadiosField()
    urgent_and_dangerous = YesNoRadiosField()


class GeneratePDFForm(forms.Form):
    pass
