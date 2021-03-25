from django.contrib.auth.models import AnonymousUser

from users.tests.factories import UserFactory
from amplitude.models import LoggedEvent


class TestLoggedEvent:
    def test_it_logs_events_for_anonymous_users(self, rf, db):
        request = rf.get("/")
        request.user = AnonymousUser()
        le = LoggedEvent.objects.create_for_request(
            request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE
        )
        assert le.pk
        assert le.user is None
        assert le.kind == "SAFE_MODE_ENABLE"

    def test_it_logs_events_for_authenticated_users(self, rf, db):
        request = rf.get("/")
        request.user = UserFactory(username="boop")
        le = LoggedEvent.objects.create_for_request(
            request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE
        )
        assert le.pk
        assert le.user.username == "boop"
        assert le.kind == "SAFE_MODE_ENABLE"

    def test_kind_works(self):
        le = LoggedEvent(kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE)
        assert le.kind_label == "Enable compatibility mode"
