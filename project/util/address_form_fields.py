from typing import Tuple
from django import forms
import graphene

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


class AddressAndBoroughFormMixin(forms.Form):
    '''
    This mixin class adds address and borough fields to a form, and attempts to
    verify their validity, potentially changing/normalizing them based on
    geocoding.

    The clean() method adds an additional entry to the cleaned data dictionary,
    `address_verified`, which is a boolean indicating whether the address was
    verified or not.
    '''

    address = forms.CharField(
        **ADDRESS_FIELD_KWARGS,
        help_text='A New York City address. Only street name and number are required.'
    )

    # For details on why this isn't a required field, see:
    # https://github.com/JustFixNYC/tenants2/issues/533
    borough = forms.ChoiceField(
        choices=BOROUGH_CHOICES.choices,
        required=False,
        help_text='A New York City borough.'
    )

    extra_graphql_output_fields = {
        'address_verified': graphene.Boolean(
            required=True,
            description=(
                "Whether the user's address was verified by a geocoder. "
                "If False, it is because the geocoder service was unavailable, "
                "not because the address is invalid."
            )
        ),
        'borough_label': graphene.String(
            required=True,
            description=(
                "A human readable text version of the user's borough"
            )
        )
    }

    def clean(self):
        cleaned_data = super().clean()
        address = cleaned_data.get('address')
        borough = cleaned_data.get('borough')
        if address and not borough:
            # Ick, this import is nasty because we don't want to depend on
            # the onboarding package; however, this code was originally in
            # the onboarding package and later factored out, and there's no
            # easy way to move the model itself.
            from onboarding.models import AddressWithoutBoroughDiagnostic
            AddressWithoutBoroughDiagnostic(address=address).save()
        if address:
            address, borough,
            address_verified = verify_address(address, borough)
            borough_label = BOROUGH_CHOICES.get_label(borough)
            if not borough and not address_verified:
                # The address verification service isn't working, so we should
                # make the borough field required since we can't infer it from
                # address verification.
                self.add_error('borough', 'This field is required.')
                return cleaned_data
            cleaned_data['address'] = address
            cleaned_data['borough'] = borough
            cleaned_data['borough_label'] = borough_label
            cleaned_data['address_verified'] = address_verified
        return cleaned_data
