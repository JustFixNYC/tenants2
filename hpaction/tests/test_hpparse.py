from django.core.management import call_command


def test_hpparse_does_not_explode(db):
    call_command('hpparse')
