from typing import List, Optional
import datetime
from django.db import models, transaction
from django.utils import timezone
from django.utils.html import format_html
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import JSONField

from project.common_data import Choices
from project.util.site_util import absolute_reverse
from project.util.instance_change_tracker import InstanceChangeTracker
from users.models import JustfixUser
from .landlord_lookup import lookup_landlord


LOC_MAILING_CHOICES = Choices.from_file('loc-mailing-choices.json')

# The amount of time a user has to change their letter of request
# content after originally submitting it.
LOC_CHANGE_LEEWAY = datetime.timedelta(hours=1)


class AccessDateManager(models.Manager):
    @transaction.atomic
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
        max_length=100, help_text="The landlord's name.")

    address = models.CharField(
        max_length=1000,
        help_text="The full mailing address for the landlord.")

    lookup_date = models.DateField(
        null=True,
        blank=True,
        help_text="When we last tried to look up the landlord's details."
    )

    is_looked_up = models.BooleanField(
        default=False,
        help_text=(
            "Whether the name and address was looked up automatically, "
            "or manually entered by the user."
        )
    )

    @property
    def address_lines_for_mailing(self) -> List[str]:
        '''Return the full mailing address as a list of lines.'''

        if not self.address:
            return []
        return self.address.split('\n')

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

    html_content = models.TextField(
        blank=True,
        help_text="The HTML content of the letter at the time it was requested."
    )

    lob_letter_object = JSONField(
        blank=True,
        null=True,
        help_text=(
            "If the letter was sent via Lob, this is the JSON response of the API call that "
            "was made to send the letter, documented at https://lob.com/docs/python#letters."
        )
    )

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.__tracker = InstanceChangeTracker(self, ['mail_choice', 'html_content'])

    @property
    def will_we_mail(self) -> bool:
        '''
        Whether or not the user wants us to mail the letter for them.
        '''

        return self.mail_choice == LOC_MAILING_CHOICES.WE_WILL_MAIL

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

    @property
    def lob_letter_html_description(self) -> str:
        '''
        Return an HTML string that describes the mailed Lob letter. If
        the letter has not been sent through Lob, return an empty string.
        '''

        lob_url = self.lob_url
        return lob_url and format_html(
            'The letter was <a href="{}" rel="noreferrer noopener" target="_blank">'
            'sent via Lob</a> with the tracking number {} and '
            "has an expected delivery date of {}.",
            lob_url,
            self.lob_letter_object['tracking_number'],
            self.lob_letter_object['expected_delivery_date']
        )

    @property
    def lob_url(self) -> str:
        '''
        Return the URL on Lob where more information about the mailed Lob
        version of this letter can be found.

        If the letter has not been sent through Lob, return an empty string.
        '''

        if not self.lob_letter_object:
            return ''
        ltr_id = self.lob_letter_object['id']

        # This URL structure isn't formally documented anywhere, it was
        # just inferred, so it could technically break at any time, but
        # it's better than nothing!
        return f"https://dashboard.lob.com/#/letters/{ltr_id}"

    def can_change_content(self) -> bool:
        if self.__tracker.original_values['mail_choice'] == LOC_MAILING_CHOICES.USER_WILL_MAIL:
            return True
        if self.lob_letter_object is not None:
            return False
        if self.created_at is None:
            return True
        return timezone.now() - self.created_at < LOC_CHANGE_LEEWAY

    def clean(self):
        super().clean()
        user = self.user
        if user and self.mail_choice == LOC_MAILING_CHOICES.WE_WILL_MAIL:
            if user.issues.count() == 0 and user.custom_issues.count() == 0:
                raise ValidationError(
                    'Please select at least one issue from the issue checklist.')
            if user.access_dates.count() == 0:
                raise ValidationError(
                    'Please provide at least one access date.')
            if not hasattr(user, 'landlord_details'):
                raise ValidationError(
                    'Please provide contact information for your landlord.')

        if self.__tracker.has_changed() and not self.can_change_content():
            raise ValidationError('Your letter is already being mailed!')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.__tracker.set_to_unchanged()
