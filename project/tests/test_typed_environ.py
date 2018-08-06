from io import StringIO
from textwrap import dedent
import pytest

from ..util import typed_environ


def test_overriding_default_value_works():
    class MyEnv(typed_environ.BaseEnvironment):
        BLARG: str = 'blarg'

    assert MyEnv().BLARG == 'blarg'
    assert MyEnv(env={'BLARG': 'no u'}).BLARG == 'no u'


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


def test_multiple_missing_values_are_logged():
    output = StringIO()

    class MyBigEnv(typed_environ.BaseEnvironment):
        FOO: bool

        BAR: str

    with pytest.raises(ValueError) as excinfo:
        MyBigEnv(err_output=output)

    assert '2 environment variables are not defined properly' in str(excinfo.value)

    assert output.getvalue().strip() == dedent('''
    2 environment variables are not defined properly.

      FOO:
        this variable must be defined!

      BAR:
        this variable must be defined!
    ''').strip()
