from typing import TypeVar, Type, Dict, Any
import pydantic

from users.models import JustfixUser


T = TypeVar('T', bound='Fields')


def get_user_field_for_airtable(user: JustfixUser, field: pydantic.fields.Field) -> Any:
    attrs = field.name.split('__')
    obj = user

    final_attr = attrs[-1]
    for attr in attrs[:-1]:
        if not hasattr(obj, attr):
            return field.default
        obj = getattr(obj, attr)

    return getattr(obj, final_attr)


class Fields(pydantic.BaseModel):
    '''
    The fields in a row of our Airtable table. Note that these are
    only the fields we care about and control: the Airtable will
    likely contain extra fields that matter to users, but that
    we don't care about for the purposes of syncing.
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
