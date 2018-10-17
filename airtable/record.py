from typing import TypeVar, Type
import pydantic

from users.models import JustfixUser


T = TypeVar('T', bound='Fields')


class Fields(pydantic.BaseModel):
    pk: int
    Name: str = ''

    @classmethod
    def from_user(cls: Type[T], user: JustfixUser) -> T:
        return cls(
            pk=user.pk,
            Name=user.full_name
        )


class Record(pydantic.BaseModel):
    id: str
    fields_: Fields = pydantic.Schema(default=..., alias='fields')
    createdTime: str
