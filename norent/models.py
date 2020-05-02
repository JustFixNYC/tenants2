from django.db import models
from django.contrib.postgres.fields import JSONField

from users.models import JustfixUser


class RentPeriod(models.Model):
    class Meta:
        ordering = ['-payment_date']

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
        unique_together = [['user', 'rent_period']]
        ordering = ['-rent_period__payment_date']

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name='norent_letters'
    )

    rent_period = models.ForeignKey(RentPeriod, on_delete=models.CASCADE)

    html_content = models.TextField(
        help_text="The HTML content of the letter at the time it was sent."
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

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return (
            f"{self.user.full_name}'s no rent letter for "
            f"{self.rent_period.payment_date}"
        )
