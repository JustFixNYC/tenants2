from django import forms

from project.forms import ensure_at_least_one_is_true
from .models import HardshipDeclarationDetails


class CovidImpactForm(forms.ModelForm):
    class Meta:
        model = HardshipDeclarationDetails
        fields = ("has_financial_hardship", "has_health_risk")

    def clean(self):
        return ensure_at_least_one_is_true(super().clean())
