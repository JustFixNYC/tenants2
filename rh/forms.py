from django import forms
from project.forms import USPhoneNumberField

# Whenever we change the fields in any of the rental history
# forms, we should change this number to ensure that we
# never use an old session's rental history data with the
# new validation logic. The downside is that the old
# session's rental history data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 4


class RhForm(forms.Form):
    first_name = forms.CharField(max_length=30)
    last_name = forms.CharField(max_length=150)
    address = forms.CharField(max_length=150)
    apartment_number = forms.CharField(max_length=15)
    phone_number = USPhoneNumberField()


class RhSendEmail(forms.Form):
    pass
