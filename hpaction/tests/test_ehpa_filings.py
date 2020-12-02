from datetime import datetime
from django.db import connection
from pytz import utc
from freezegun import freeze_time

from onboarding.tests.factories import OnboardingInfoFactory
from hpaction.tests.factories import DocusignEnvelopeFactory, HPActionDetailsFactory
from hpaction.models import HP_DOCUSIGN_STATUS_CHOICES, HP_ACTION_CHOICES
from hpaction.ehpa_filings import execute_ehpa_filings_query
from project.util.streaming_json import generate_json_rows


def test_it_works(db, django_file_storage):
    with freeze_time("2020-01-02"):
        de = DocusignEnvelopeFactory(
            status=HP_DOCUSIGN_STATUS_CHOICES.SIGNED,
            docs__kind=HP_ACTION_CHOICES.EMERGENCY,
            docs__user__email="boop@jones.com",
        )
        OnboardingInfoFactory(user=de.docs.user)
        HPActionDetailsFactory(
            user=de.docs.user,
            sue_for_harassment=True,
            sue_for_repairs=False,
        )
    with connection.cursor() as cursor:
        execute_ehpa_filings_query(cursor)
        rows = list(generate_json_rows(cursor))
        assert rows == [
            {
                "created_at": datetime(2020, 1, 2, tzinfo=utc),
                "first_name": "Boop",
                "last_name": "Jones",
                "borough": "BROOKLYN",
                "phone_number": "5551234567",
                "email": "boop@jones.com",
                "sue_for_harassment": True,
                "sue_for_repairs": False,
            }
        ]
