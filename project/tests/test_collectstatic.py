from django.core.management import call_command


def test_collectstatic_works():
    call_command('collectstatic', '--noinput')
