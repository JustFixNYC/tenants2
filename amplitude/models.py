import uuid
from django.db import models
from django.http import HttpRequest

from project.common_data import Choices
from users.models import JustfixUser


SYNC_CHOICES = Choices.from_file("amplitude-sync-choices.json")

LOGGED_EVENT_CHOICES = Choices.from_file("amplitude-logged-event-choices.json")


class Sync(models.Model):
    """
    Details on when we most recently synced data with Amplitude.
    """

    kind = models.CharField(max_length=30, choices=SYNC_CHOICES.choices, unique=True)

    last_synced_at = models.DateTimeField()


class LoggedEventManager(models.Manager):
    def _get_or_create_device_id_for_request(self, request: HttpRequest) -> str:
        device_id: str = request.COOKIES.get("jf_device_id", "")
        if not device_id:
            if "fallback_jf_device_id" not in request.session:
                request.session["fallback_jf_device_id"] = f"justfix-device:{uuid.uuid4()}"
            device_id = request.session["fallback_jf_device_id"]
        return device_id

    def create_for_request(self, request: HttpRequest, **kwargs) -> "LoggedEvent":
        user = request.user
        if not request.user.is_authenticated:
            user = None
        device_id = self._get_or_create_device_id_for_request(request)
        event = LoggedEvent(user=user, device_id=device_id, **kwargs)
        event.full_clean()
        event.save()
        return event


class LoggedEvent(models.Model):
    class Meta:
        ordering = (
            "created_at",
            "id",
        )

    CHOICES = LOGGED_EVENT_CHOICES

    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE, null=True, blank=True)

    device_id = models.CharField(max_length=64)

    kind = models.CharField(max_length=50, choices=CHOICES.choices)

    objects = LoggedEventManager()

    @property
    def kind_label(self) -> str:
        return LoggedEvent.CHOICES.get_label(self.kind)
