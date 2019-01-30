from django.core.management import call_command


def test_it_works(db):
    call_command('loadfindhelpcbos')
