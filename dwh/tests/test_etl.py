from django.core.management import call_command

from rh.tests.factories import RentalHistoryRequestFactory
from loc.tests.factories import LetterRequestFactory
from dwh.models import (
    OnlineRentHistoryRequest,
    LetterOfComplaintRequest
)


def test_it_does_not_explode(db):
    rhr = RentalHistoryRequestFactory.create()
    LetterRequestFactory.create(user=rhr.user)
    call_command('etl', '--skip-rapidpro-runs')
    assert OnlineRentHistoryRequest.objects.all().count() == 1
    assert LetterOfComplaintRequest.objects.all().count() == 1
