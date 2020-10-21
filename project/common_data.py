import json
from enum import Enum
from typing import List, Tuple, Dict, Optional, Set
from pathlib import Path
import pydantic


MY_DIR = Path(__file__).parent.resolve()

COMMON_DATA_DIR = MY_DIR.parent / 'common-data'

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

    Finally, you can create a new Choices that represents a subset of
    the choices:

        >>> limited = c.only("BROOKLYN", "QUEENS")
        >>> limited.choices
        [('BROOKLYN', 'Brooklyn'), ('QUEENS', 'Queens')]
    '''

    choices: DjangoChoices

    choices_dict: Dict[str, str]

    enum: Enum

    name: str

    def __init__(self, choices: DjangoChoices, name: str = 'DjangoChoices') -> None:
        self.name = name
        self.choices = choices
        self.choices_dict = dict(self.choices)

        # New versions of mypy error here with
        # "Enum type as attribute is not supported" so we'll just ignore.
        self.enum = Enum(  # type: ignore
            name,
            [(choice, label) for choice, label in self.choices]
        )

    def __getattr__(self, value: str) -> str:
        if value in self.choices_dict:
            return value
        raise AttributeError(
            f'{value} is not a property, method, or valid choice')

    def get_label(self, value: str) -> str:
        return self.choices_dict[value]

    def get_enum_member(self, value: str) -> Enum:
        return getattr(self.enum, value)

    def validate_choices(self, *values: str):
        for value in values:
            if value not in self.choices_dict:
                raise ValueError(f"'{value}' is not a valid choice")

    def only(self, *values: str, name: Optional[str] = None) -> 'Choices':
        name = name or self.name
        self.validate_choices(*values)
        choices: DjangoChoices = [
            (choice, label) for choice, label in self.choices
            if choice in values
        ]
        return Choices(choices, name)

    @property
    def choice_set(self) -> Set[str]:
        return set(self.choices_dict.keys())

    @classmethod
    def from_file(cls, *path: str, name: str = 'DjangoChoices'):
        obj = load_json(*path)
        return cls(_ValidatedChoices(choices=obj).choices, name=name)


def load_json(*path: str):
    return json.loads(COMMON_DATA_DIR.joinpath(*path).read_text())
