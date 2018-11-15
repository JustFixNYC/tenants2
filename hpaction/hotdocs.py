from typing import Union, List, Sequence, NamedTuple
from enum import Enum
from datetime import date
from xml.dom.minidom import getDOMImplementation, Element


class MCValue:
    '''Represents a multiple-choice answer in a HotDocs Answer Set.'''

    items: List[str]

    def __init__(self, *items: str) -> None:
        self.items = list(items)


class AnswerType(Enum):
    """
    Enumeration for the core answer types in HotDocs. The values correspond
    to the tag names used in the HotDocs Answer Set XML.
    """

    TEXT = 'TextValue'
    TF = 'TFValue'
    NUM = 'NumValue'
    DATE = 'DateValue'
    MC = 'MCValue'


class Unanswered(NamedTuple):
    """
    Represents an unanswered value in a HotDocs Answer Set.
    Primarily (possibly exclusively) used in repeated answers.
    """

    type: AnswerType


# The split between "BaseAnswerValue" and "AnswerValue" is due to
# the fact that mypy doesn't currently support recursive types.
BaseAnswerValue = Union[str, int, float, bool, date, MCValue, Unanswered]
AnswerValue = Union[BaseAnswerValue, List[BaseAnswerValue]]


def enum2mc(enum: Union[Enum, Sequence[Enum]]) -> MCValue:
    """
    Convert an Enum or list of Enums into a MCValue.
    """

    enums: List[Enum] = enum if isinstance(enum, list) else [enum]
    return MCValue(*[enum.value for enum in enums])


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
        if isinstance(value, Unanswered):
            node = self.doc.createElement(value.type.value)
            node.setAttribute('unans', "true")
            return node
        elif isinstance(value, str):
            node = self.doc.createElement(AnswerType.TEXT.value)
            node.appendChild(self.doc.createTextNode(value))
            return node
        elif isinstance(value, bool):
            node = self.doc.createElement(AnswerType.TF.value)
            text = 'true' if value else 'false'
            node.appendChild(self.doc.createTextNode(text))
            return node
        elif isinstance(value, (int, float)):
            node = self.doc.createElement(AnswerType.NUM.value)
            node.appendChild(self.doc.createTextNode(str(value)))
            return node
        elif isinstance(value, date):
            node = self.doc.createElement(AnswerType.DATE.value)
            date_str = f'{value.month}/{value.day}/{value.year}'
            node.appendChild(self.doc.createTextNode(date_str))
            return node
        elif isinstance(value, MCValue):
            node = self.doc.createElement(AnswerType.MC.value)
            for item in value.items:
                child_node = self.doc.createElement('SelValue')
                child_node.appendChild(self.doc.createTextNode(item))
                node.appendChild(child_node)
            return node
        elif isinstance(value, list):
            node = self.doc.createElement('RptValue')
            for child in value:
                node.appendChild(self.create_answer_value(child))
            return node
        raise ValueError(f'cannot convert {type(value).__name__} to a valid answer type')

    def add(self, name: str, value: AnswerValue) -> None:
        answer = self.doc.createElement('Answer')
        answer.setAttribute('name', name)
        answer.appendChild(self.create_answer_value(value))
        self.answer_set.appendChild(answer)

    def __str__(self) -> str:
        return self.doc.toprettyxml(indent='    ', newl='\n')
