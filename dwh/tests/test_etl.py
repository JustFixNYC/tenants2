from django.core.management import call_command

from rh.tests.factories import RentalHistoryRequestFactory
from loc.tests.factories import LetterRequestFactory
from hpaction.tests.factories import DocusignEnvelopeFactory
from dwh.models import (
    OnlineRentHistoryRequest,
    LetterOfComplaintRequest,
    EmergencyHPASigning,
)


def test_it_does_not_explode(db, django_file_storage):
    rhr = RentalHistoryRequestFactory.create()
    LetterRequestFactory.create(user=rhr.user)
    DocusignEnvelopeFactory.create(
        docs__user=rhr.user,
        status="SIGNED",
    )
    call_command('etl', '--skip-rapidpro-runs')
    assert OnlineRentHistoryRequest.objects.all().count() == 1
    assert LetterOfComplaintRequest.objects.all().count() == 1
    assert EmergencyHPASigning.objects.all().count() == 1
