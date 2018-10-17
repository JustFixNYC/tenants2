from typing import TypeVar, Type
import pydantic

from project.util.site_util import absolute_reverse
from users.models import JustfixUser


T = TypeVar('T', bound='Fields')


class Fields(pydantic.BaseModel):
    '''
    The fields in a row of our Airtable table. Note that these are
    only the fields we care about and control: the Airtable will
    likely contain extra fields that matter to users, but that
    we don't care about for the purposes of syncing.
    '''

    # The primary key of the JustfixUser that the row represents.
    pk: int

    # The user's full name.
    Name: str = ''

    # The admin URL where the user info can be viewed/changed.
    AdminURL: str = ''

    @classmethod
    def from_user(cls: Type[T], user: JustfixUser) -> T:
        '''
        Given a user, return the Fields that represent their data.
        '''

        return cls(
            pk=user.pk,
            Name=user.full_name,
            AdminURL=absolute_reverse(
                'admin:users_justfixuser_change', args=[user.pk])
        )


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
