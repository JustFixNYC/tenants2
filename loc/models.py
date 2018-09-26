from typing import List, Optional
import datetime
from django.db import models
from django.utils import timezone

from project.common_data import Choices
from users.models import JustfixUser
from .landlord_lookup import lookup_landlord


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
        max_length=100, blank=True, help_text="The landlord's name.")

    address = models.CharField(
        max_length=1000,
        blank=True,
        help_text="The full mailing address for the landlord.")

    lookup_date = models.DateField(
        null=True,
        help_text="When we last tried to look up the landlord's details."
    )

    is_looked_up = models.BooleanField(
        default=False,
        help_text=(
            "Whether the name and address was looked up automatically, "
            "or manually entered by the user."
        )
    )

    @classmethod
    def create_lookup_for_user(cls, user: JustfixUser) -> Optional['LandlordDetails']:
        if hasattr(user, 'onboarding_info'):
            oi = user.onboarding_info
            info = lookup_landlord(f"{oi.address}, {oi.borough_label}")
            details = LandlordDetails(
                user=user,
                lookup_date=timezone.now()
            )
            if info:
                details.name = info.ownername
                details.address = info.businessaddr or ''
                details.is_looked_up = True
            details.save()
            return details
        return None


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
        choices=LOC_MAILING_CHOICES.choices,
        help_text="How the letter of complaint will be mailed.")

    def __str__(self):
        if not (self.created_at and self.user and self.user.full_name):
            return super().__str__()
        return (
            f"{self.user.full_name}'s letter of complaint request from "
            f"{self.created_at.strftime('%A, %B %d %Y')}"
        )
