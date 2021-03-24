from django.db import models
from django.http import HttpRequest

from users.models import JustfixUser
from project import common_data


LOGGED_EVENT_CHOICES = common_data.Choices.from_file("frontend-logged-event-choices.json")


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
