from textwrap import dedent
from datetime import date
from decimal import Decimal
from enum import Enum
import pytest

from ..hotdocs import AnswerSet, MCValue, Unanswered, AnswerType, enum2mc, enum2mc_opt, none2unans


def test_full_documents_are_rendered():
    a = AnswerSet()
    a.add("Full Name", "Boop Jones")
    a.add_opt("Other Thing", None)
    assert str(a) == dedent(
        """\
        <?xml version="1.0" ?>
        <AnswerSet title="New Answer File" version="1.1">
            <Answer name="Full Name">
                <TextValue>Boop Jones</TextValue>
            </Answer>
        </AnswerSet>
        """
    )


def test_error_raised_if_type_is_invalid():
    class Foo:
        pass

    with pytest.raises(ValueError, match="cannot convert Foo to a valid answer type"):
        AnswerSet().create_answer_value(Foo())  # type: ignore


class Funky(Enum):
    BOOP = "boop"
    BLAP = "blap"


def test_enum2mc_works():
    assert enum2mc(Funky.BOOP).items == ["boop"]  # type: ignore
    assert enum2mc([Funky.BOOP, Funky.BLAP]).items == ["boop", "blap"]  # type: ignore

    unans = Unanswered(AnswerType.TF)
    assert enum2mc(unans) is unans


def test_enum2mc_opt_works():
    assert enum2mc_opt(None) is None
    assert enum2mc_opt(Funky.BOOP).items == ["boop"]  # type: ignore


def test_none2unans_works():
    assert none2unans("blarg", AnswerType.TEXT) == "blarg"
    assert none2unans(None, AnswerType.TEXT) == Unanswered(AnswerType.TEXT)


def value_xml(value):
    return AnswerSet().create_answer_value(value).toxml()


def test_unanswered_answer_values_work():
    assert value_xml(Unanswered(AnswerType.TF)) == '<TFValue unans="true"/>'


def test_text_answer_values_are_escaped():
    assert value_xml("<blarg>") == "<TextValue>&lt;blarg&gt;</TextValue>"


def test_bool_answer_values_work():
    assert value_xml(True) == "<TFValue>true</TFValue>"
    assert value_xml(False) == "<TFValue>false</TFValue>"


def test_numeric_answer_values_work():
    assert value_xml(5) == "<NumValue>5</NumValue>"
    assert value_xml(5.5) == "<NumValue>5.5</NumValue>"
    assert value_xml(Decimal("5.03")) == "<NumValue>5.03</NumValue>"


def test_date_answer_values_work():
    # Yes, apparently hotdocs takes a dd/mm/yyyy format.
    assert value_xml(date(2017, 1, 2)) == "<DateValue>2/1/2017</DateValue>"


def test_multiple_choice_values_work():
    assert value_xml(MCValue("foo", "bar")) == (
        "<MCValue>" "<SelValue>foo</SelValue>" "<SelValue>bar</SelValue>" "</MCValue>"
    )


def test_list_values_are_converted_to_rptvalue():
    assert value_xml([1, 2]) == (
        "<RptValue>" "<NumValue>1</NumValue>" "<NumValue>2</NumValue>" "</RptValue>"
    )


def test_invalid_answer_types_raise_errors():
    with pytest.raises(ValueError, match="cannot convert function to a valid answer type"):
        value_xml(lambda: None)
