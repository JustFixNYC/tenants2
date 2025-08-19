from django import forms
from onboarding.models import OnboardingInfo
from project.forms import SetPasswordForm

class CreateAccount(SetPasswordForm, forms.ModelForm):
    class Meta:
        model = OnboardingInfo
        fields = ("can_we_sms",)

    agree_to_terms = forms.BooleanField(required=True)
    email = forms.EmailField(required=False)

