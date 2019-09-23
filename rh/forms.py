from django import forms

# Whenever we change the fields in any of the rental history
# forms, we should change this number to ensure that we
# never use an old session's rental history data with the
# new validation logic. The downside is that the old
# session's rental history data will disappear, but hopefully
# we won't have to do this often.
FIELD_SCHEMA_VERSION = 2

class RhForm(forms.Form):
    first_name = forms.CharField(max_length=30)
    last_name = forms.CharField(max_length=150)