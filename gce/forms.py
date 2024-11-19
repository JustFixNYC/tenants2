from typing import Dict
from django import forms
import pydantic
from django.http import JsonResponse
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

from gce.models import GoodCauseEvictionScreenerResponse

class GceScreenerResponseForm(forms.ModelForm):
    class Meta:
        model = GoodCauseEvictionScreenerResponse
        fields = ['id', 'bbl', 'house_number']
        
# class GceScreenerResponseForm(forms.Form):
#     id = forms.IntegerField(required=False)
#     bbl = forms.CharField(required=False)
#     #     validators=[
#     #         RegexValidator(
#     #             r"^[1-5]\d\d\d\d\d\d\d\d\d$",
#     #             message="This should be a 10-digit padded BBL.",
#     #         )
#     #     ],
#     #     required=False
#     # )
#     house_number = forms.CharField(required=False)
#     street_name = forms.CharField(required=False)
#     borough = forms.CharField(required=False)
#     zipcode = forms.CharField(required=False)

class GcePostData(pydantic.BaseModel):
    id: int
    bbl: str
    house_number: str
    street_name: str
    borough: str
    zipcode: str


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

def get_validated_form_data(data) -> GcePostData:
    form = GceScreenerResponseForm(data)
    if not form.is_valid():
        raise InvalidFormError(form)
    return form.cleaned_data
