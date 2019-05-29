from django import forms

from project.forms import YesNoRadiosField
from .models import FeeWaiverDetails


class FeeWaiverIncomeForm(forms.ModelForm):
    class Meta:
        model = FeeWaiverDetails
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
        model = FeeWaiverDetails
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
        model = FeeWaiverDetails
        fields = ['asked_before']

    asked_before = YesNoRadiosField()


class GeneratePDFForm(forms.Form):
    pass
