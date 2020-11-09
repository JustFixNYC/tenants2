from django.core.management import call_command


def test_saje_users(db):
    call_command('exportstats', 'saje-users')


def test_saje_norent_letters(db):
    call_command('exportstats', 'saje-norent-letters')
