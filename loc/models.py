from typing import List
import datetime
from django.db import models

from project.common_data import Choices
from users.models import JustfixUser


LOC_MAILING_CHOICES = Choices.from_file('loc-mailing-choices.json')


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


class LandlordDetails(models.Model):
    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='landlord_details',
        help_text="The user whose landlord details this is for.")

    name = models.CharField(
        max_length=100, help_text="The landlord's name.")

    address = models.CharField(
        max_length=1000,
        help_text="The full mailing address for the landlord.")


class LetterRequest(models.Model):
    '''
    A completed letter of complaint request submitted by a user.
    '''

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name='letter_request')

    mail_choice = models.TextField(
        max_length=30,
        choices=LOC_MAILING_CHOICES,
        help_text="How the letter of complaint will be mailed.")
