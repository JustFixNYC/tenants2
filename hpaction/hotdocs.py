from typing import Union, List, Any, Optional
from enum import Enum
from datetime import date
from xml.dom.minidom import getDOMImplementation, Element


class MCValue:
    '''Represents a multiple-choice answer in a HotDocs Answer Set.'''

    items: List[str]

    def __init__(self, *items: str) -> None:
        self.items = list(items)


# Note that for the list, we would ideally write List['AnswerValue']
# but mypy doesn't currently support recursive types.
AnswerValue = Union[str, int, float, bool, date, MCValue, List[Any]]


def unwrap_enum(enum: Enum) -> str:
    assert isinstance(enum, Enum)
    assert isinstance(enum.value, str)
    return enum.value


class AnswerSet:
    '''
    Represents a HotDocs Answer Collection/Set, documented here:

    http://help.hotdocs.com/server/webhelp/index.htm#Concepts/Answer_Files_Overview.htm
    '''

    def __init__(self) -> None:
        self.impl = getDOMImplementation()
        self.doc = self.impl.createDocument(None, 'AnswerSet', None)
        self.answer_set = self.doc.documentElement
        self.answer_set.setAttribute('title', 'New Answer File')
        self.answer_set.setAttribute('version', '1.1')

    def create_answer_value(self, value: AnswerValue) -> Element:
        if isinstance(value, str):
            node = self.doc.createElement('TextValue')
            node.appendChild(self.doc.createTextNode(value))
            return node
        elif isinstance(value, bool):
            node = self.doc.createElement('TFValue')
            text = 'true' if value else 'false'
            node.appendChild(self.doc.createTextNode(text))
            return node
        elif isinstance(value, (int, float)):
            node = self.doc.createElement('NumValue')
            node.appendChild(self.doc.createTextNode(str(value)))
            return node
        elif isinstance(value, date):
            node = self.doc.createElement('DateValue')
            date_str = f'{value.month}/{value.day}/{value.year}'
            node.appendChild(self.doc.createTextNode(date_str))
            return node
        elif isinstance(value, MCValue):
            node = self.doc.createElement('MCValue')
            for item in value.items:
                child_node = self.doc.createElement('SelValue')
                child_node.appendChild(self.doc.createTextNode(item))
                node.appendChild(child_node)
            return node
        elif isinstance(value, list):
            node = self.doc.createElement('RptValue')
            for item in value:
                node.appendChild(self.create_answer_value(item))
            return node
        raise ValueError(f'cannot convert {type(value).__name__} to a valid answer type')

    def add(self, name: str, value: AnswerValue) -> None:
        answer = self.doc.createElement('Answer')
        answer.setAttribute('name', name)
        answer.appendChild(self.create_answer_value(value))
        self.answer_set.appendChild(answer)

    def add_opt(self, name: str, value: Optional[AnswerValue]) -> None:
        if value is not None:
            self.add(name, value)

    def add_opt_enum(self, name: str, value: Optional[Enum]) -> None:
        if value is not None:
            self.add(name, MCValue(value.value))

    # For some bizarre reason mypy doesn't like this being an Optional[List[Enum]],
    # as it claims there's a type error when the passed-in enum is a sublcass of Enum,
    # so we'll just have to set it to Any.
    def add_opt_enum_list(self, name: str, value: Optional[List[Any]]) -> None:
        if value is not None:
            self.add(name, MCValue(*[
                item.value for item in value
            ]))

    def __str__(self) -> str:
        return self.doc.toprettyxml(indent='    ', newl='\n')
