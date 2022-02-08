from django import forms
from loc import models as loc_models

from loc.forms import validate_non_stupid_name
from project.util import lob_api


class LandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = loc_models.LandlordDetails
        fields = (
            "name",
            "primary_line",
            "city",
            "state",
            "zip_code",
            "email",
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
