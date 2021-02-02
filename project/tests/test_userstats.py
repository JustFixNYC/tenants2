from django.db import connection
from freezegun import freeze_time

from hpaction.tests.factories import DocusignEnvelopeFactory
from project.userstats import execute_user_stats_query
from onboarding.tests.factories import OnboardingInfoFactory
from project.util.streaming_json import generate_json_rows


def test_it_includes_latest_ehpa_sign_date(db, django_file_storage):
    oi = OnboardingInfoFactory()
    with freeze_time("2020-08-21"):
        DocusignEnvelopeFactory(status="SIGNED", docs__user=oi.user)
    with connection.cursor() as cur:
        execute_user_stats_query(cur)
        result = list(generate_json_rows(cur))
        assert len(result) == 1
        assert result[0]["latest_signed_ehpa_date"].date().isoformat() == "2020-08-21"
