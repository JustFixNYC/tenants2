from io import StringIO
from textwrap import dedent
from typing import Optional
import pytest

from ..util import typed_environ


def test_print_help_works():
    class PrintyEnv(typed_environ.BaseEnvironment):
        THINGY: bool = True

    out = StringIO()
    PrintyEnv().print_help(out)
    assert "THINGY" in out.getvalue()


def test_get_envhelp_returns_empty_str():
    assert typed_environ.get_envhelp(int) == ""


def test_exception_raised_if_converter_not_found():
    class NoConverterEnv(typed_environ.BaseEnvironment):
        OOF: StringIO

    with pytest.raises(ValueError, match="Unable to find converter"):
        NoConverterEnv(env={"OOF": "hmm"})


def test_overriding_default_value_works():
    class MyEnv(typed_environ.BaseEnvironment):
        BLARG: str = "blarg"

    assert MyEnv().BLARG == "blarg"
    assert MyEnv(env={"BLARG": "no u"}).BLARG == "no u"


def test_ints_work():
    class MyIntyEnv(typed_environ.BaseEnvironment):
        INTY: int

    assert MyIntyEnv(env={"INTY": "5"}).INTY == 5


def test_optional_values_work():
    class MyOptionalEnv(typed_environ.BaseEnvironment):
        BLARG: Optional[bool]

    assert MyOptionalEnv().BLARG is None
    assert MyOptionalEnv(env={"BLARG": "yes"}).BLARG is True


def test_get_docs_work():
    class MyDocumentedEnv(typed_environ.BaseEnvironment):
        # Docs for blarg...
        # Another line is here.
        BLARG: bool = True

        # Docs for oof...
        OOF: str = ""

    assert MyDocumentedEnv().get_docs() == {
        "BLARG": "Docs for blarg...\nAnother line is here.",
        "OOF": "Docs for oof...",
    }


def test_system_exit_is_raised_if_exit_when_invalid_is_true():
    class SystemExitEnv(typed_environ.BaseEnvironment):
        BLAH: bool

    with pytest.raises(SystemExit) as excinfo:
        SystemExitEnv(exit_when_invalid=True)

    assert excinfo.value.args[0] == 1


def test_nothing_is_raised_if_throw_when_invalid_is_false():
    class YuckyEnv(typed_environ.BaseEnvironment):
        BLAH: bool
        THINGY: bool = True

    e = YuckyEnv(throw_when_invalid=False)
    assert e.THINGY is True
    assert not hasattr(e, "BLAH")


def test_multiple_missing_values_are_logged():
    output = StringIO()

    class MyBigEnv(typed_environ.BaseEnvironment):
        FOO: bool

        # Here are some docs for BAR.
        BAR: str

    with pytest.raises(ValueError) as excinfo:
        MyBigEnv(err_output=output)

    assert "Error evaluating environment variables FOO, BAR" in str(excinfo.value)

    assert (
        output.getvalue().strip()
        == dedent(
            """
    2 environment variables are not defined properly.

      FOO:
        this variable must be defined!

        The value should be one of 'yes', 'yup', 'true' for True, or 'no',
        'nope', 'false' for False.

      BAR:
        this variable must be defined!

        Here are some docs for BAR.
    """
        ).strip()
    )
