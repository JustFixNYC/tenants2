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


class SueForHarassmentForm(forms.ModelForm):
    class Meta:
        model = models.HPActionDetails
        fields = [
            'sue_for_harassment'
        ]

    sue_for_harassment = YesNoRadiosField()


class PreviousAttemptsForm(forms.ModelForm):
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

    def add_dynamically_required_error(self, field: str):
        msg = forms.Field.default_error_messages['required']
        self.add_error(field, ValidationError(msg, code='required'))

    def require_bool_field(self, field: str, cleaned_data) -> Optional[bool]:
        value = YesNoRadiosField.coerce(cleaned_data.get(field))
        if value is None:
            self.add_dynamically_required_error(field)
        else:
            assert isinstance(value, bool)
        return value

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


class HarassmentApartmentForm(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'more_than_two_apartments_in_building',
            'more_than_one_family_per_apartment',
        ]

    more_than_two_apartments_in_building = YesNoRadiosField()
    more_than_one_family_per_apartment = YesNoRadiosField()


class HarassmentAllegations1Form(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'alleg_force',
        ]


class HarassmentAllegations2Form(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'alleg_removed_possessions',
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


class HarassmentCaseHistoryForm(forms.ModelForm):
    class Meta:
        model = models.HarassmentDetails
        fields = [
            'prior_relief_sought_case_numbers_and_dates',
        ]


class GeneratePDFForm(forms.Form):
    pass
