from django import forms

from project import common_data
from . import models


ISSUE_VALIDATION = common_data.load_json("issue-validation.json")

CUSTOM_ISSUE_MAX_LENGTH: int = ISSUE_VALIDATION["CUSTOM_ISSUE_MAX_LENGTH"]
MAX_CUSTOM_ISSUES_PER_AREA: int = ISSUE_VALIDATION["MAX_CUSTOM_ISSUES_PER_AREA"]


class CustomIssueForm(forms.ModelForm):
    class Meta:
        model = models.CustomIssue
        fields = ["description"]

    description = forms.CharField(max_length=CUSTOM_ISSUE_MAX_LENGTH)


class IssueAreaFormV2(forms.Form):
    area = forms.ChoiceField(
        choices=models.ISSUE_AREA_CHOICES.choices, help_text="The area for the issues being set."
    )

    issues = forms.MultipleChoiceField(
        required=False,
        choices=models.ISSUE_CHOICES.choices,
        help_text=(
            "The issues to set. Any issues not listed, but in the same area, will be " "removed."
        ),
    )

    def clean(self):
        cleaned_data = super().clean()
        area = cleaned_data.get("area")
        issues = cleaned_data.get("issues")

        if area and (issues is not None):
            for issue in issues:
                models.ensure_issue_matches_area(issue, area)
