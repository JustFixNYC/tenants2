from typing import List, Optional
import datetime
from django.db import models
from django.utils import timezone

from project.common_data import Choices
from project.util.site_util import absolute_reverse
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
    '''
    This represents the landlord details for a user's address, either
    manually entered by them or automatically looked up by us (or a
    combination of the two, if the user decided to change what we
    looked up).
    '''

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
        '''
        Create an instance of this class by attempting to look up details on the
        given user's address.

        Assumes that the user does not yet have an instance of this class associated
        with them.

        If the lookup fails, this method will still create an instance of this class,
        but it will set the lookup date, so that another lookup can be attempted
        later.

        However, if the user doesn't have any address information, this will return
        None, as it has no address to lookup the landlord for.
        '''

        if hasattr(user, 'onboarding_info'):
            oi = user.onboarding_info
            info = lookup_landlord(oi.full_address)
            details = LandlordDetails(
                user=user,
                lookup_date=timezone.now()
            )
            if info:
                details.name = info.name
                details.address = info.address
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

    @property
    def admin_pdf_url(self) -> str:
        '''
        A link where an administrative/staff user can view the
        letter of complaint as a PDF.

        If we don't have enough information to generate such a link,
        this will be an empty string.
        '''

        if self.pk is None:
            return ''
        return absolute_reverse('loc_for_user', kwargs={'user_id': self.user.pk})

    def __str__(self):
        if not (self.created_at and self.user and self.user.full_name):
            return super().__str__()
        return (
            f"{self.user.full_name}'s letter of complaint request from "
            f"{self.created_at.strftime('%A, %B %d %Y')}"
        )
