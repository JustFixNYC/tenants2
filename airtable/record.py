from typing import TypeVar, Type, Dict, Any, Optional
import datetime
import pydantic

from users.models import JustfixUser


T = TypeVar('T', bound='Fields')


# Example values for the Fields class (defined below). Note that the
# keys are the names of the fields as they should appear in Airtable.
#
# To accelerate the creation of an Airtable base with these fields,
# consider using the "exampleairtablecsv" management command.
EXAMPLE_FIELDS = {
    # In Airtable, this should be a "Number" field with an "Integer" format.
    'pk': 1,

    # In Airtable, this should be a "Single line text" field.
    'first_name': 'Boop',

    # In Airtable, this should be a "Single line text" field.
    'last_name': 'Jones',

    # In Airtable, this should be a "URL" field.
    'admin_url': 'https://example.com/admin/users/justfixuser/1/change/',

    # In Airtable, this should be a "Phone number" field.
    'phone_number': '5551234560',

    # In Airtable, this should be a "Checkbox" field.
    'can_we_sms': False,

    # In Airtable, this should be a "Single line text" field.
    'lease_type': 'RENT_STABILIZED',

    # In Airtable, this should be a "Date" field.
    'letter_request_date': '2018-01-02',

    # In Airtable, this should be a "Long text" field.
    'address': '123 Boop Way\nApartment 2\nNew York, NY 11201',

    # In Airtable, this should be a "Single line text" field.
    'pad_bbl': '3002920026',

    # In Airtable, this should be a "URL" field.
    'letter_pdf_url': 'https://example.com/loc/admin/1/letter.pdf',

    # In Airtable, this should be a "Single line text" field.
    'landlord_name': 'Landlordo Calrissian',

    # In Airtable, this should be a "Long text" field.
    'landlord_address': '1 Cloud City',

    # In Airtable, this should be a "Checkbox" field.
    'will_we_mail_letter': True
}


def get_user_field_for_airtable(user: JustfixUser, field: pydantic.fields.Field) -> Any:
    '''
    Given a field name that may have double underscores in it to indicate
    that it spans relationships, find the given user field and
    return it, potentially changing its type for use with Airtable.
    '''

    attrs = field.name.split('__')
    obj = user

    final_attr = attrs[-1]
    for attr in attrs[:-1]:
        if not hasattr(obj, attr):
            # The optional spanned relationship doesn't exist.
            return field.default
        obj = getattr(obj, attr)

    value = getattr(obj, final_attr)

    if isinstance(value, datetime.datetime):
        # Airtable's date fields expect a UTC date string, e.g. "2014-09-05".
        return value.date().isoformat()

    return value


class Fields(pydantic.BaseModel):
    '''
    The fields in a row of our Airtable table. Note that these are
    only the fields we care about and control: the Airtable will
    likely contain extra fields that matter to users, but that
    we don't care about for the purposes of syncing.

    The names of the fields are either attributes of our
    user model, or they are attributes of related models, which
    are named using Django's syntax for lookups that span
    relationships [1]:

    > To span a relationship, just use the field name of related
    > fields across models, separated by double underscores,
    > until you get to the field you want.

    In some cases, we use pydantic's "alias" feature to ensure
    that the Airtable field name is more readable than the
    notation we use internally.

    [1] https://docs.djangoproject.com/en/2.1/topics/db/queries/
    '''

    # The primary key of the JustfixUser that the row represents.
    pk: int = -1

    # The user's first name.
    first_name: str = ''

    # The user's last name.
    last_name: str = ''

    # The admin URL where the user info can be viewed/changed.
    admin_url: str = ''

    # The user's phone number.
    phone_number: str = ''

    # Whether we can SMS the user.
    onboarding_info__can_we_sms: bool = pydantic.Schema(default=False, alias='can_we_sms')

    # The user's lease type.
    onboarding_info__lease_type: str = pydantic.Schema(default='', alias='lease_type')

    # When the user's letter of complaint was requested.
    letter_request__created_at: Optional[str] = pydantic.Schema(
        # Note that it's important to set dates to None/null in Airtable if they don't
        # exist, as Airtable will complain that it can't parse the value if we give it
        # an empty string.
        default=None, alias='letter_request_date')

    # The tenant's full mailing address.
    onboarding_info__address_for_mailing: str = pydantic.Schema(default='', alias='address')

    # The tenant's boro-block-lot (BBL) number.
    onboarding_info__pad_bbl: str = pydantic.Schema(default='', alias='pad_bbl')

    # A link to the letter of complaint PDF.
    letter_request__admin_pdf_url: str = pydantic.Schema(default='', alias='letter_pdf_url')

    # The tenant's landlord's name.
    landlord_details__name: str = pydantic.Schema(default='', alias='landlord_name')

    # The tenant's landlord's address.
    landlord_details__address: str = pydantic.Schema(default='', alias='landlord_address')

    # Whether or not the user wants us to mail the letter for them.
    letter_request__will_we_mail: bool = pydantic.Schema(
        default=False, alias='will_we_mail_letter')

    @classmethod
    def from_user(cls: Type[T], user: JustfixUser) -> T:
        '''
        Given a user, return the Fields that represent their data.
        '''

        kwargs: Dict[str, Any] = {}

        for field in cls.__fields__.values():
            kwargs[field.alias] = get_user_field_for_airtable(user, field)

        return cls(**kwargs)


class Record(pydantic.BaseModel):
    '''
    A Record essentially represents a row in our Airtable table.
    '''

    # Airtable's unique id for this row, e.g. "recFLEuThPbUkwmsq".
    id: str

    # The fields of this row. We need to call it "fields_" because
    # the attribute "fields" is already used by pydantic.
    fields_: Fields = pydantic.Schema(default=..., alias='fields')

    # The date the row was created, e.g. '2018-10-15T20:27:20.000Z'.
    createdTime: str
