from typing import List
import datetime
from django.db import models

from users.models import JustfixUser


class AccessDateManager(models.Manager):
    def set_for_user(self, user: JustfixUser, dates: List[datetime.date]):
        self.filter(user=user).delete()
        self.bulk_create([
            AccessDate(user=user, date=date)
            for date in dates
        ])

    def get_for_user(self, user: JustfixUser) -> List[datetime.date]:
        return [ad.date for ad in user.access_dates.all()]


class AccessDate(models.Model):
    class Meta:
        unique_together = ('user', 'date')

    user = models.ForeignKey(
        JustfixUser, on_delete=models.CASCADE, related_name='access_dates',
        help_text="The user whose dwelling this access date this is for.")

    date = models.DateField(
        help_text="The date on which the user's dwelling will be accessible.")

    objects = AccessDateManager()
