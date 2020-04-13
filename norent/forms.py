from django import forms


class TenantInfo(forms.Form):
    '''
    Corresponds to fields in our scaffolding model that
    involve tenant info.
    '''

    first_name = forms.CharField()

    last_name = forms.CharField()

    street = forms.CharField()

    city = forms.CharField()

    state = forms.CharField()

    zip_code = forms.CharField()

    apt_number = forms.CharField()

    email = forms.CharField()

    phone_number = forms.CharField()


class LandlordInfo(forms.Form):
    '''
    Corresponds to fields in our scaffolding model that
    involve landlord info.
    '''

    landlord_name = forms.CharField()

    # e.g. "666 FIFTH AVENUE, APT 2"
    landlord_primary_line = forms.CharField()

    landlord_city = forms.CharField()

    landlord_state = forms.CharField()

    landlord_zip_code = forms.CharField()

    landlord_email = forms.CharField()

    landlord_phone_number = forms.CharField()
