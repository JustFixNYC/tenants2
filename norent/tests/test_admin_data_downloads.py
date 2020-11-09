from django.core.management import call_command

from .factories import RentPeriodFactory


def test_saje_users(db):
    call_command('exportstats', 'saje-users')


def test_saje_norent_letters(db):
    RentPeriodFactory()
    call_command('exportstats', 'saje-norent-letters')
