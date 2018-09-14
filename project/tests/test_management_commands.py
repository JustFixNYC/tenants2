from io import StringIO
from django.core.management import call_command


def test_envhelp_works():
    out = StringIO()
    call_command('envhelp', stdout=out)
    assert 'DEBUG' in out.getvalue()
