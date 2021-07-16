from project.util.rename_dict_keys import flip_dict
from django import forms

from project.util.phone_number import USPhoneNumberField
from project.util.address_form_fields import AddressAndBoroughFormMixin
from .models import RentalHistoryRequest


# Whenever we change the fields in any of the rental history
# forms, we should change this number to ensure that we
# never use an old session's rental history data with the
# new validation logic. The downside is that the old
# session's rental history data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 5


class RhForm(AddressAndBoroughFormMixin, forms.ModelForm):
    class Meta:
        model = RentalHistoryRequest
        fields = (
            "first_name",
            "last_name",
            "apartment_number",
        )

    phone_number = USPhoneNumberField()

    to_scaffolding_keys = {
        **AddressAndBoroughFormMixin.to_scaffolding_keys,
        "apartment_number": "apt_number",
    }

    from_scaffolding_keys = flip_dict(to_scaffolding_keys)


class RhSendEmail(forms.Form):
    pass
