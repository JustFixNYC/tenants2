from typing import Union
from xml.dom.minidom import getDOMImplementation, Element


AnswerValue = Union[str, int, float, bool]


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
        raise ValueError(f'cannot convert {type(value).__name__} to a valid answer type')

    def add(self, name: str, value: AnswerValue) -> None:
        answer = self.doc.createElement('Answer')
        answer.setAttribute('name', name)
        answer.appendChild(self.create_answer_value(value))
        self.answer_set.appendChild(answer)

    def __str__(self) -> str:
        return self.doc.toprettyxml(indent='    ', newl='\n')
