from django import forms
from django.http import JsonResponse
from django.core.validators import RegexValidator

from gce.models import GoodCauseEvictionScreenerResponse

# Haven't been able to get this to work for validation. form.cleaned_data always
# returns the data with all fields as the default null/empty value. If we can
# figure out a different option for validation this whole file can be deleted


class GceScreenerResponseForm(forms.ModelForm):
    class Meta:
        model = GoodCauseEvictionScreenerResponse
        fields = ["id", "bbl", "house_number"]


class GceScreenerResponseForm2(forms.Form):
    id = forms.IntegerField(required=False)
    bbl = forms.CharField(
        validators=[
            RegexValidator(
                r"^[1-5]\d\d\d\d\d\d\d\d\d$",
                message="This should be a 10-digit padded BBL.",
            )
        ],
        required=False,
    )
    house_number = forms.CharField(required=False)
    street_name = forms.CharField(required=False)
    borough = forms.CharField(required=False)
    zipcode = forms.CharField(required=False)


class InvalidFormError(Exception):
    def __init__(self, form):
        self.form_errors = form.errors.get_json_data()

    def as_json_response(self):
        return JsonResponse(
            {
                "error": "Bad request",
                "validationErrors": self.form_errors,
            },
            status=400,
        )


def get_validated_form_data(data):
    form = GceScreenerResponseForm(data)
    if not form.is_valid():
        raise InvalidFormError(form)
    return form.cleaned_data
