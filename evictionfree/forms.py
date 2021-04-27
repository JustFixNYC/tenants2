from django import forms

from project.forms import (
    DynamicallyRequiredFieldsMixin,
    YesNoRadiosField,
    ensure_at_least_one_is_true,
)
from .models import HardshipDeclarationDetails


class IndexNumberForm(DynamicallyRequiredFieldsMixin, forms.ModelForm):
    class Meta:
        model = HardshipDeclarationDetails
        fields = ("index_number",)

    has_current_case = YesNoRadiosField()

    def clean(self):
        cleaned_data = super().clean()

        has_current_case = YesNoRadiosField.coerce(cleaned_data.get("has_current_case"))

        if has_current_case is True:
            self.require_text_field("index_number", cleaned_data)
        elif has_current_case is False:
            cleaned_data["index_number"] = ""

        return cleaned_data


class IndexNumberFormV2(DynamicallyRequiredFieldsMixin, forms.ModelForm):
    class Meta:
        model = HardshipDeclarationDetails
        fields = (
            "index_number",
            "court_name",
        )

    has_current_case = YesNoRadiosField()

    def clean(self):
        cleaned_data = super().clean()

        has_current_case = YesNoRadiosField.coerce(cleaned_data.get("has_current_case"))

        if has_current_case is True:
            self.require_text_field("index_number", cleaned_data)
        elif has_current_case is False:
            cleaned_data["index_number"] = ""
            cleaned_data["court_name"] = ""

        return cleaned_data


class CovidImpactForm(forms.ModelForm):
    class Meta:
        model = HardshipDeclarationDetails
        fields = ("has_financial_hardship", "has_health_risk")

    def clean(self):
        return ensure_at_least_one_is_true(super().clean())


class AgreeToLegalTermsForm(forms.Form):
    complies_with_other_lawful_terms = forms.BooleanField(required=True)

    understands_financial_obligations = forms.BooleanField(required=True)

    understands_protection_is_temporary = forms.BooleanField(required=True)


class SigningTruthfullyForm(forms.Form):
    is_signing_truthfully = forms.BooleanField(required=True)
