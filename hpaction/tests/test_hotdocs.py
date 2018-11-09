from textwrap import dedent
from ..hotdocs import AnswerSet


def test_full_documents_are_rendered():
    a = AnswerSet()
    a.add('Full Name', 'Boop Jones')
    assert str(a) == dedent(
        '''\
        <?xml version="1.0" ?>
        <AnswerSet title="New Answer File" version="1.1">
            <Answer name="Full Name">
                <TextValue>Boop Jones</TextValue>
            </Answer>
        </AnswerSet>
        ''')


def test_answer_values_are_escaped():
    a = AnswerSet().create_answer_value('<blarg>').toxml()
    assert a == '<TextValue>&lt;blarg&gt;</TextValue>'
