from django.db import models
from django.http import HttpRequest

from project.common_data import Choices
from users.models import JustfixUser


SYNC_CHOICES = Choices.from_file("amplitude-sync-choices.json")

LOGGED_EVENT_CHOICES = Choices.from_file("frontend-logged-event-choices.json")


class Sync(models.Model):
    """
    Details on when we most recently synced data with Amplitude.
    """

    kind = models.CharField(max_length=30, choices=SYNC_CHOICES.choices, unique=True)

    last_synced_at = models.DateTimeField()


class LoggedEventManager(models.Manager):
    def create_for_request(self, request: HttpRequest, **kwargs) -> "LoggedEvent":
        user = request.user
        if not request.user.is_authenticated:
            user = None
        event = LoggedEvent(user=user, **kwargs)
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

    kind = models.CharField(max_length=50, choices=CHOICES.choices)

    objects = LoggedEventManager()

    @property
    def kind_label(self) -> str:
        return LoggedEvent.CHOICES.get_label(self.kind)
