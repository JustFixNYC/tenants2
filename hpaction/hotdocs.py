from typing import Union, List, Sequence, NamedTuple, Optional, TypeVar
from decimal import Decimal
from enum import Enum
from datetime import date
from xml.dom.minidom import getDOMImplementation, Element


T = TypeVar("T")


class MCValue:
    """Represents a multiple-choice answer in a HotDocs Answer Set."""

    items: List[str]

    def __init__(self, *items: str) -> None:
        self.items = list(items)


class AnswerType(Enum):
    """
    Enumeration for the core answer types in HotDocs. The values correspond
    to the tag names used in the HotDocs Answer Set XML.
    """

    TEXT = "TextValue"
    TF = "TFValue"
    NUM = "NumValue"
    DATE = "DateValue"
    MC = "MCValue"


class Unanswered(NamedTuple):
    """
    Represents an unanswered value in a HotDocs Answer Set.
    Primarily (possibly exclusively) used in repeated answers.
    """

    type: AnswerType


# The split between "BaseAnswerValue" and "AnswerValue" is due to
# the fact that mypy doesn't currently support recursive types.
BaseAnswerValue = Union[str, int, float, Decimal, bool, date, MCValue, Unanswered]
AnswerValue = Union[BaseAnswerValue, Sequence[BaseAnswerValue]]


def enum2mc(enum: Union[Enum, Sequence[Enum], Unanswered]) -> Union[MCValue, Unanswered]:
    """
    Convert an Enum or list of Enums into a MCValue. However, if the value is
    an Unanswered, just return it as-is.
    """

    if isinstance(enum, Unanswered):
        return enum

    enums = [enum] if isinstance(enum, Enum) else enum
    return MCValue(*[enum.value for enum in enums])


def enum2mc_opt(
    enum: Union[Enum, Sequence[Enum], Unanswered, None]
) -> Union[MCValue, Unanswered, None]:
    """
    Like enum2mc(), but also takes None, and passes it through if provided.
    """

    if enum is None:
        return None
    return enum2mc(enum)


def none2unans(value: Optional[T], answer_type: AnswerType) -> Union[Unanswered, T]:
    """
    If the given value is None, return an Unanswered of the given type.
    Otherwise, return the value.
    """

    if value is None:
        return Unanswered(answer_type)
    return value


class AnswerSet:
    """
    Represents a HotDocs Answer Collection/Set, documented here:

    http://help.hotdocs.com/server/webhelp/index.htm#Concepts/Answer_Files_Overview.htm
    """

    def __init__(self) -> None:
        self.impl = getDOMImplementation()
        self.doc = self.impl.createDocument(None, "AnswerSet", None)
        self.answer_set = self.doc.documentElement
        self.answer_set.setAttribute("title", "New Answer File")
        self.answer_set.setAttribute("version", "1.1")

    def create_unanswered(self, value: Unanswered) -> Element:
        node = self.doc.createElement(value.type.value)
        node.setAttribute("unans", "true")
        return node

    def create_text(self, value: str) -> Element:
        node = self.doc.createElement(AnswerType.TEXT.value)
        node.appendChild(self.doc.createTextNode(value))
        return node

    def create_true_false(self, value: bool) -> Element:
        node = self.doc.createElement(AnswerType.TF.value)
        text = "true" if value else "false"
        node.appendChild(self.doc.createTextNode(text))
        return node

    def create_number(self, value: Union[int, float, Decimal]) -> Element:
        node = self.doc.createElement(AnswerType.NUM.value)
        node.appendChild(self.doc.createTextNode(str(value)))
        return node

    def create_date(self, value: date) -> Element:
        node = self.doc.createElement(AnswerType.DATE.value)
        date_str = f"{value.day}/{value.month}/{value.year}"
        node.appendChild(self.doc.createTextNode(date_str))
        return node

    def create_mc(self, value: MCValue) -> Element:
        node = self.doc.createElement(AnswerType.MC.value)
        for item in value.items:
            child_node = self.doc.createElement("SelValue")
            child_node.appendChild(self.doc.createTextNode(item))
            node.appendChild(child_node)
        return node

    def create_repeat(self, value: List[BaseAnswerValue]) -> Element:
        node = self.doc.createElement("RptValue")
        for child in value:
            node.appendChild(self.create_answer_value(child))
        return node

    def create_answer_value(self, value: AnswerValue) -> Element:
        if isinstance(value, Unanswered):
            return self.create_unanswered(value)
        elif isinstance(value, str):
            return self.create_text(value)
        elif isinstance(value, bool):
            return self.create_true_false(value)
        elif isinstance(value, (int, float, Decimal)):
            return self.create_number(value)
        elif isinstance(value, date):
            return self.create_date(value)
        elif isinstance(value, MCValue):
            return self.create_mc(value)
        elif isinstance(value, list):
            return self.create_repeat(value)
        raise ValueError(f"cannot convert {type(value).__name__} to a valid answer type")

    def add(self, name: str, value: AnswerValue) -> None:
        answer = self.doc.createElement("Answer")
        answer.setAttribute("name", name)
        answer.appendChild(self.create_answer_value(value))
        self.answer_set.appendChild(answer)

    def add_opt(self, name: str, value: Optional[AnswerValue]) -> None:
        if value is None:
            return
        self.add(name, value)

    def __str__(self) -> str:
        return self.doc.toprettyxml(indent="    ", newl="\n")
