import datetime
import re
from typing import List
import pydantic
from django import forms
from django.core.exceptions import ValidationError

from project.util import lob_api
from . import models
from project import common_data


class AccessDatesValidation(pydantic.BaseModel):
    MIN_DAYS: int


class AccessDatesForm(forms.Form):
    # On the client-side, we auto-fill the first date as being MIN_DAYS
    # from today, but we don't want to deny it on the server when it's
    # close to midnight, or due to time zone mismatch issues, so
    # in reality we'll allow for a bit of leeway.
    MIN_DAYS_LEEWAY = datetime.timedelta(days=1)

    NUM_DATE_FIELDS = 3

    date1 = forms.DateField(required=True)

    date2 = forms.DateField(required=False)

    date3 = forms.DateField(required=False)

    def clean(self):
        dates = self.get_cleaned_dates(super().clean())
        if len(dates) != len(set(dates)):
            raise ValidationError("Please ensure all the dates are different.")
        self._validate_minimum_dates(dates)

    def _validate_minimum_dates(self, dates: List[datetime.date]):
        cfg = AccessDatesValidation(**common_data.load_json("access-dates-validation.json"))
        today = datetime.date.today() - self.MIN_DAYS_LEEWAY
        for date in dates:
            if (date - today).days < cfg.MIN_DAYS:
                raise ValidationError(
                    f"Please ensure all dates are at least {cfg.MIN_DAYS} days from today."
                )

    def get_cleaned_dates(self, cleaned_data=None) -> List[datetime.date]:
        if cleaned_data is None:
            cleaned_data = self.cleaned_data
        result = []
        for i in range(self.NUM_DATE_FIELDS):
            date = cleaned_data.get(f"date{i + 1}")
            if date is not None:
                result.append(date)
        return result


class WorkOrderForm(forms.Form):
    # For NYCHA or RAD/PACT users only
    no_ticket = forms.BooleanField(required=False)


class TicketNumberForm(forms.Form):
    # For NYCHA or RAD/PACT users only
    ticket_number = forms.CharField(label="Work order ticket number", max_length=10, required=False)


class TicketNumberFormset(forms.BaseFormSet):
    def clean(self):
        super().clean()
        forms = self.forms
        counter = 0
        for form in forms:
            ticket_number = form.cleaned_data.get("ticket_number")
            if ticket_number and re.search(r"[^a-zA-Z0-9]", ticket_number):
                raise ValidationError("Ticket numbers may only contain letters and numbers")

    def get_cleaned_data(self, is_no_ticket_number_checked):
        result = []
        for i in self.cleaned_data:
            # ignore empty fields
            if i["ticket_number"]:
                result.append(i["ticket_number"])
        if not is_no_ticket_number_checked and not result:
            return []
        return result


def validate_non_stupid_name(name: str):
    if name.lower().startswith("united states"):
        # This is super weird; we've had at least two users somehow
        # submit this as their LL name without intending to. We suspect
        # buggy Chrome form autofill is to blame, but until we figure
        # out more, we'll just reject this particular value outright.
        raise ValidationError("This is not a valid landlord name.")


class LandlordDetailsFormV2(forms.ModelForm):
    class Meta:
        model = models.LandlordDetails
        fields = (
            "name",
            "primary_line",
            "city",
            "state",
            "zip_code",
        )

    name = forms.CharField(
        # Our model's limits are more lax than that of Lob's API, so
        # hew to Lob's limits.
        max_length=lob_api.MAX_NAME_LEN,
        required=True,
        validators=[validate_non_stupid_name],
        help_text=models.LandlordDetails._meta.get_field("name").help_text,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in ["primary_line", "city", "state", "zip_code"]:
            self.fields[field].required = True


class OptionalLandlordDetailsForm(forms.ModelForm):
    class Meta:
        model = models.LandlordDetails
        fields = ("email", "phone_number")


class LetterRequestForm(forms.ModelForm):
    class Meta:
        model = models.LetterRequest
        fields = ("mail_choice",)

    def clean(self):
        super().clean()
        self.instance.regenerate_html_content(author="the user")
