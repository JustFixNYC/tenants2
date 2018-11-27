import json
from enum import Enum
from typing import List, Tuple, Dict
from pathlib import Path
import graphene
import pydantic


MY_DIR = Path(__file__).parent.resolve()

COMMON_DATA_DIR = MY_DIR.parent / 'common-data'

DEFAULT_NAME = 'DjangoChoices'

DjangoChoices = List[Tuple[str, str]]


class _ValidatedChoices(pydantic.BaseModel):
    '''
    This is an internal class for validating that
    JSON files representing Django choices contain
    the expected structure.
    '''

    choices: DjangoChoices


class Choices:
    '''
    This is a convenience wrapper around Django choices.

    You can load choices from a file:

        >>> c = Choices.from_file('borough-choices.json')

    Then you can look up labels:

        >>> c.get_label('BROOKLYN')
        'Brooklyn'

    You can also pass choices on to Django classes that
    can use them via the 'choices' attribute. Here's the
    first two, for instance:

        >>> c.choices[:2]
        [('BROOKLYN', 'Brooklyn'), ('QUEENS', 'Queens')]

    You can also access the value strings via attributes:

        >>> c.BROOKLYN
        'BROOKLYN'

    Of course, specifying an invalid value will fail:

        >>> c.BOOP
        Traceback (most recent call last):
        ...
        AttributeError: BOOP is not a property, method, or valid choice

    If you want an Enum interface for the choices, you can also have
    that, e.g.:

        >>> MyChoices = c.enum
        >>> MyChoices.BROOKLYN.name
        'BROOKLYN'
        >>> MyChoices.BROOKLYN.value
        'Brooklyn'
    '''

    choices: DjangoChoices

    choices_dict: Dict[str, str]

    enum: Enum

    graphene_enum: graphene.Enum

    def __init__(self, choices: DjangoChoices, name: str=DEFAULT_NAME, description: str='') -> None:
        self.choices = choices
        self.choices_dict = dict(self.choices)
        self.name = name
        self.description = description
        self.enum = Enum(
            name,
            [(choice, label) for choice, label in self.choices]
        )
        self.graphene_enum = graphene.Enum(
            name,
            [(choice, choice) for choice, _ in self.choices],
            description=self.__get_graphene_enum_description
        )

    def __get_graphene_enum_description(self, thing) -> str:
        if thing is None:
            return self.description
        return self.choices_dict[thing.value]

    def __getattr__(self, value: str) -> str:
        if value in self.choices_dict:
            return value
        raise AttributeError(
            f'{value} is not a property, method, or valid choice')

    def get_label(self, value: str) -> str:
        return self.choices_dict[value]

    def get_enum_member(self, value: str) -> Enum:
        return getattr(self.enum, value)

    @classmethod
    def from_file(cls, *path, name: str=DEFAULT_NAME, description: str=''):
        obj = json.loads(COMMON_DATA_DIR.joinpath(*path).read_text())
        return cls(
            _ValidatedChoices(choices=obj).choices,
            name=name,
            description=description
        )
