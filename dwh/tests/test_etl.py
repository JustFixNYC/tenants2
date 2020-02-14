from django.core.management import call_command


def test_etl_does_not_explode(db):
    call_command('etl', '--views-only')
