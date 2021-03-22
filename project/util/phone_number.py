import re
from typing import Dict, Any

from django import forms
from django.utils.translation import gettext as _
from django.core.exceptions import ValidationError


PHONE_NUMBER_LEN = 10

ALL_DIGITS_RE = re.compile(r"[0-9]+")


def get_model_field_kwargs() -> Dict[str, Any]:
    return dict(
        max_length=PHONE_NUMBER_LEN,
        validators=[validate_phone_number],
        help_text='A U.S. phone number without parentheses or hyphens, e.g. "5551234567".',
    )


def validate_phone_number(value: str) -> None:
    if len(value) != PHONE_NUMBER_LEN:
        raise ValidationError(
            _("U.S. phone numbers must be %(phone_number_len)s digits.")
            % {
                "phone_number_len": PHONE_NUMBER_LEN,
            }
        )
    if not ALL_DIGITS_RE.fullmatch(value):
        raise ValidationError(_("Phone numbers can only contain digits."))
    if value[0] in ("0", "1"):
        # 0 and 1 are invalid leading digits of area codes:
        # https://en.wikipedia.org/wiki/List_of_North_American_Numbering_Plan_area_codes
        raise ValidationError(
            _("%(areacode)s is an invalid area code.")
            % {
                "areacode": value[0:3],
            }
        )


def humanize(phone_number: str) -> str:
    if len(phone_number) != PHONE_NUMBER_LEN:
        return phone_number
    area_code = phone_number[0:3]
    first_three_digits = phone_number[3:6]
    last_digits = phone_number[6:]
    return f"({area_code}) {first_three_digits}-{last_digits}"


class USPhoneNumberField(forms.CharField):
    """
    A field for a United States phone number.
    """

    def __init__(self, *args, **kwargs):
        kwargs["max_length"] = 15  # Allow for extra characters, we'll remove them.
        super().__init__(*args, **kwargs)

    def clean(self, value: str) -> str:
        cleaned = super().clean(value)
        cleaned = "".join([ch for ch in cleaned if ch in "1234567890"])
        if len(cleaned) == PHONE_NUMBER_LEN + 1 and cleaned.startswith("1"):
            # The user specified the country calling code, remove it.
            cleaned = cleaned[1:]
        if len(cleaned) != PHONE_NUMBER_LEN:
            raise ValidationError(
                _(
                    "This does not look like a U.S. phone number. "
                    "Please include the area code, e.g. (555) 123-4567."
                )
            )
        validate_phone_number(cleaned)
        return cleaned
