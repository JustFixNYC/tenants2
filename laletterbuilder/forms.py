from django import forms
from laletterbuilder.models import LA_ISSUE_CHOICES, LA_MAILING_CHOICES
from loc import models as loc_models

from loc.forms import validate_non_stupid_name
from onboarding.models import OnboardingInfo
from project.forms import SetPasswordForm
from project.util import lob_api


class CreateAccount(SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("can_we_sms",)

    agree_to_terms = forms.BooleanField(required=True)
    email = forms.EmailField(required=False)


class LandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = loc_models.LandlordDetails
        fields = (
            "name",
            "primary_line",
            "city",
            "state",
            "zip_code"
        )

    name = forms.CharField(
        # Our model's limits are more lax than that of Lob's API, so
        # hew to Lob's limits.
        max_length=lob_api.MAX_NAME_LEN,
        required=True,
        validators=[validate_non_stupid_name],
        help_text=loc_models.LandlordDetails._meta.get_field("name").help_text,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in ["name", "primary_line", "city", "state", "zip_code"]:
            self.fields[field].required = True


class HabitabilityIssuesForm(forms.Form):

    la_issues = forms.MultipleChoiceField(
        required=False,
        choices=LA_ISSUE_CHOICES.choices,
        help_text=("The issues to set. Any issues not listed will be removed."),
    )


class SendOptionsForm(forms.ModelForm):
    class Meta:
        model = loc_models.LandlordDetails
        fields = (
            "email",
        )

    mail_choice = forms.ChoiceField(required=True, choices=LA_MAILING_CHOICES.choices)