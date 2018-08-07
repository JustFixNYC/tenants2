from io import StringIO
from textwrap import dedent
from typing import Optional
import pytest

from ..util import typed_environ


def test_get_envhelp_returns_empty_str():
    assert typed_environ.get_envhelp(int) == ''


def test_overriding_default_value_works():
    class MyEnv(typed_environ.BaseEnvironment):
        BLARG: str = 'blarg'

    assert MyEnv().BLARG == 'blarg'
    assert MyEnv(env={'BLARG': 'no u'}).BLARG == 'no u'


def test_optional_values_work():
    class MyOptionalEnv(typed_environ.BaseEnvironment):
        BLARG: Optional[bool]

    assert MyOptionalEnv().BLARG is None
    assert MyOptionalEnv(env={'BLARG': 'yes'}).BLARG is True


def test_get_docs_work():
    class MyDocumentedEnv(typed_environ.BaseEnvironment):
        # Docs for blarg...
        # Another line is here.
        BLARG: bool = True

        # Docs for oof...
        OOF: str = ''

    assert MyDocumentedEnv().get_docs() == {
        'BLARG': 'Docs for blarg...\nAnother line is here.',
        'OOF': 'Docs for oof...'
    }


def test_system_exit_is_raised():
    class SystemExitEnv(typed_environ.BaseEnvironment):
        BLAH: bool

    with pytest.raises(SystemExit) as excinfo:
        SystemExitEnv(exit_when_invalid=True)

    assert excinfo.value.args[0] == 1


def test_multiple_missing_values_are_logged():
    output = StringIO()

    class MyBigEnv(typed_environ.BaseEnvironment):
        FOO: bool

        # Here are some docs for BAR.
        BAR: str

    with pytest.raises(ValueError) as excinfo:
        MyBigEnv(err_output=output)

    assert 'Error evaluating environment variables FOO, BAR' in str(excinfo.value)

    assert output.getvalue().strip() == dedent('''
    2 environment variables are not defined properly.

      FOO:
        this variable must be defined!

      BAR:
        this variable must be defined!

        Here are some docs for BAR.
    ''').strip()
