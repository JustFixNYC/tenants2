from typing import List
from django.db import models

from users.models import JustfixUser


class Metadata(models.Model):
    """
    General metadata about the state of our RapidPro syncing.

    This model is a singleton! There should never be more
    than one instance of it in the database.
    """

    last_sync = models.DateTimeField(
        help_text="The date and time RapidPro was last synced with, if ever.",
        null=True
    )


class ContactGroup(models.Model):
    """
    A RapidPro Contact Group.
    """

    # The maximum length here is clearly more than it really needs to
    # be, but I'm not sure what the technical maximum length of the
    # field is, so I'm just playing it safe. -AV
    uuid = models.CharField(max_length=255, primary_key=True)

    name = models.CharField(max_length=255)

    users = models.ManyToManyField(JustfixUser, through='UserContactGroup')

    def __str__(self):
        return self.name


class UserContactGroup(models.Model):
    """
    An association between a user and a RapidPro Contact Group.
    """

    class Meta:
        unique_together = ("user", "group")

    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE)

    group = models.ForeignKey(ContactGroup, on_delete=models.CASCADE)

    earliest_known_date = models.DateTimeField(
        help_text="The earliest known date/time the user was seen in this contact group.")

    def __str__(self):
        return f"User {self.user}'s association with RapidPro contact group '{self.group}'"


def get_group_names_for_user(user: JustfixUser) -> List[str]:
    if user.pk is None:
        return []

    groups = list(
        UserContactGroup.objects.filter(user=user).values_list('group__name'))

    return [group[0] for group in groups]
