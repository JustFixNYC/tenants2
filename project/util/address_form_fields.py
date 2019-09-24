from typing import Tuple
from django import forms

from project import geocoding
from project.common_data import Choices

BOROUGH_CHOICES = Choices.from_file('borough-choices.json')

ADDRESS_MAX_LENGTH = 200

BOROUGH_MAX_LENGTH = 20

# The keys here were obtained experimentally, I'm not actually sure
# if/where they are formally specified.
BOROUGH_GID_TO_CHOICE = {
    'whosonfirst:borough:1': BOROUGH_CHOICES.MANHATTAN,
    'whosonfirst:borough:2': BOROUGH_CHOICES.BRONX,
    'whosonfirst:borough:3': BOROUGH_CHOICES.BROOKLYN,
    'whosonfirst:borough:4': BOROUGH_CHOICES.QUEENS,
    'whosonfirst:borough:5': BOROUGH_CHOICES.STATEN_ISLAND,
}

BOROUGH_FIELD_KWARGS = {
    'max_length': BOROUGH_MAX_LENGTH,
    'choices': BOROUGH_CHOICES.choices,
}

ADDRESS_FIELD_KWARGS = {
    'max_length': ADDRESS_MAX_LENGTH,
}


def get_geocoding_search_text(address: str, borough: str) -> str:
    if borough not in BOROUGH_CHOICES.choices_dict:
        borough = ''
    if borough:
        borough_label = BOROUGH_CHOICES.get_label(borough)
        return ', '.join([address, borough_label])
    return address


def verify_address(address: str, borough: str) -> Tuple[str, str, bool]:
    '''
    Attempt to verify the given address, returning the address, and whether it
    was actually verified. If the address was verified, the returned address
    may have changed.
    '''

    search_text = get_geocoding_search_text(address, borough)
    features = geocoding.search(search_text)
    if features is None:
        # Hmm, the geocoding service is unavailable. This
        # is unfortunate, but we don't want it to block
        # onboarding, so keep a note of it and let the
        # user continue.
        address_verified = False
    elif len(features) == 0:
        # The geocoding service is available, but the
        # address produces no results.
        raise forms.ValidationError('The address provided is invalid.')
    else:
        address_verified = True
        props = features[0].properties
        address = props.name
        borough = BOROUGH_GID_TO_CHOICE[props.borough_gid]
    return address, borough, address_verified


class AddressAndBoroughFormMixin:
    def clean(self):
        cleaned_data = super().clean()  # type: ignore
        address = cleaned_data.get('address')
        borough = cleaned_data.get('borough')
        if address and not borough:
            from onboarding.models import AddressWithoutBoroughDiagnostic
            AddressWithoutBoroughDiagnostic(address=address).save()
        if address:
            address, borough, address_verified = verify_address(address, borough)
            if not borough and not address_verified:
                # The address verification service isn't working, so we should
                # make the borough field required since we can't infer it from
                # address verification.
                self.add_error('borough', 'This field is required.')
                return cleaned_data
            cleaned_data['address'] = address
            cleaned_data['borough'] = borough
            cleaned_data['address_verified'] = address_verified
        return cleaned_data
