from typing import Optional
import datetime
from django.db import models
from django.contrib.postgres.fields import JSONField

from users.models import JustfixUser
from project.locales import LOCALE_KWARGS


class RentPeriodManager(models.Manager):
    def find_by_iso_date(self, value: str) -> Optional['RentPeriod']:
        return self.filter(payment_date=datetime.date.fromisoformat(value)).first()


class RentPeriod(models.Model):
    class Meta:
        ordering = ['-payment_date']

    objects = RentPeriodManager()

    payment_date = models.DateField(
        help_text="The date rent payment is due.",
        unique=True,
    )

    def __str__(self):
        return f"Rent period for {self.payment_date}"


class Letter(models.Model):
    '''
    A no rent letter that is ready to be sent.
    '''

    class Meta:
        ordering = ['-created_at']

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name='norent_letters'
    )

    locale = models.CharField(
        **LOCALE_KWARGS,
        help_text=(
            "The locale of the user who sent the letter, at the time that "
            "they sent it. Note that this may be different from the user's "
            "current locale, e.g. if they changed it after sending the "
            "letter."
        ),
    )

    rent_periods = models.ManyToManyField(RentPeriod)

    html_content = models.TextField(
        help_text=(
            "The HTML content of the letter at the time it was sent, in "
            "English."
        )
    )

    localized_html_content = models.TextField(
        help_text=(
            "The HTML content of the letter at the time it was sent, in "
            "the user's locale at the time they sent it. If the user's "
            "locale is English, this will be blank (since the English "
            "version is already stored in another field)."
        ),
        blank=True
    )

    lob_letter_object = JSONField(
        blank=True,
        null=True,
        help_text=(
            "If the letter was sent via Lob, this is the JSON response of the API call that "
            "was made to send the letter, documented at https://lob.com/docs/python#letters."
        )
    )

    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="The tracking number for the letter.",
    )

    letter_sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the letter was mailed."
    )

    letter_emailed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the letter was e-mailed."
    )

    @property
    def latest_rent_period(self) -> Optional['RentPeriod']:
        rps = self.rent_periods.order_by('-payment_date')
        if not rps:
            return None
        return rps[0]

    def __get_rent_period_dates_str(self) -> str:
        return ', '.join([
            str(rp.payment_date) for rp
            in self.rent_periods.order_by('payment_date')
        ])

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return (
            f"{self.user.full_name}'s no rent letter for "
            f"{self.__get_rent_period_dates_str()}"
        )
