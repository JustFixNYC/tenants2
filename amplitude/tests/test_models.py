from users.tests.factories import UserFactory
from amplitude.models import LoggedEvent


class TestLoggedEvent:
    def test_it_uses_id_from_cookie_if_available(self, http_request, db):
        http_request.COOKIES["jf_device_id"] = "abcdef"
        le = LoggedEvent.objects.create_for_request(
            http_request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE
        )
        assert le.device_id == "abcdef"

    def test_it_reuses_fallback_device_id(self, http_request, db):
        le1 = LoggedEvent.objects.create_for_request(
            http_request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE
        )
        le2 = LoggedEvent.objects.create_for_request(
            http_request, kind=LoggedEvent.CHOICES.SAFE_MODE_DISABLE
        )
        assert le1.device_id.startswith("justfix-device:")
        assert le1.device_id == le2.device_id

    def test_it_logs_events_for_anonymous_users(self, http_request, db):
        le = LoggedEvent.objects.create_for_request(
            http_request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE
        )
        assert le.pk
        assert le.user is None
        assert le.kind == "SAFE_MODE_ENABLE"
        assert le.device_id.startswith("justfix-device:")

    def test_it_logs_events_for_authenticated_users(self, http_request, db):
        http_request.user = UserFactory(username="boop")
        le = LoggedEvent.objects.create_for_request(
            http_request, kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE
        )
        assert le.pk
        assert le.user.username == "boop"
        assert le.kind == "SAFE_MODE_ENABLE"
        assert le.device_id.startswith("justfix-device:")

    def test_kind_works(self):
        le = LoggedEvent(kind=LoggedEvent.CHOICES.SAFE_MODE_ENABLE)
        assert le.kind_label == "Enable compatibility mode"
