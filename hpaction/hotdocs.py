from typing import Union, List, Any
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


# For some bizarre reason mypy doesn't like us using List[Enum] here,
# so we'll just have to set it to List[Any].
def enum2mc(enum: Union[Enum, List[Any]]) -> MCValue:
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

    def __str__(self) -> str:
        return self.doc.toprettyxml(indent='    ', newl='\n')
