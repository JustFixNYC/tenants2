from .. import typed_environ


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
