from django.core.management import call_command

from rh.tests.factories import RentalHistoryRequestFactory
from dwh.models import OnlineRentHistoryRequest


def test_online_rent_history_loads(db):
    RentalHistoryRequestFactory.create()
    call_command('etl', '--skip-rapidpro-runs')
    assert OnlineRentHistoryRequest.objects.all().count() == 1
