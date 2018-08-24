from unittest.mock import patch
from io import StringIO
from django.core.management import call_command


def test_envhelp_works():
    out = StringIO()
    call_command('envhelp', stdout=out)
    assert 'DEBUG' in out.getvalue()


def test_runprodserver_works():
    with patch('subprocess.check_call') as mock:
        call_command('runprodserver')
        npm, cs, runserver = mock.call_args_list

        npm_cmdline = npm[0][0]
        assert 'npm' in npm_cmdline

        npm_env = npm[1]['env']
        assert npm_env['NODE_ENV'] == 'production'

        cs_cmdline = cs[0][0]
        assert 'collectstatic' in cs_cmdline

        runserver_cmdline = runserver[0][0]
        assert 'runserver' in runserver_cmdline

        runserver_env = runserver[1]['env']
        assert runserver_env['DEBUG'] == 'false'
        assert runserver_env['USE_DEVELOPMENT_DEFAULTS'] == 'true'
