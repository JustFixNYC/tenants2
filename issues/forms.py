from django import forms

from . import models


class IssueAreaForm(forms.Form):
    area = forms.ChoiceField(
        choices=models.ISSUE_AREA_CHOICES.choices)

    issues = forms.MultipleChoiceField(
        required=False,
        choices=models.ISSUE_CHOICES.choices)

    def clean(self):
        cleaned_data = super().clean()
        area = cleaned_data.get('area')
        issues = cleaned_data.get('issues')

        if area and (issues is not None):
            for issue in issues:
                models.ensure_issue_matches_area(issue, area)
