from django.db import models

from project.common_data import Choices


SYNC_CHOICES = Choices.from_file("amplitude-sync-choices.json")


class Sync(models.Model):
    """
    Details on when we most recently synced data with Amplitude.
    """

    kind = models.CharField(max_length=30, choices=SYNC_CHOICES.choices, unique=True)

    last_synced_at = models.DateTimeField()
