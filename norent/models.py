from typing import Optional, List
import datetime
from django.db import models
from project.util.lob_models_util import MailItem
from users.models import JustfixUser


class CityWithoutStateDiagnostic(models.Model):
    """
    Information about submitted city/state forms that contained
    city information without state information.

    We're not storing this information in Google Analytics
    or Rollbar because those services make it very hard
    or impossible to delete sensitive data, and users might
    be entering their _full_ address into this field, which is PII.
    """

    city = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)


class RentPeriodManager(models.Manager):
    def get_by_iso_date(self, value: str) -> "RentPeriod":
        return self.get(payment_date=datetime.date.fromisoformat(value))

    def get_available_for_user(self, user: JustfixUser) -> List["RentPeriod"]:
        used = self.filter(letter__user=user)
        return list(self.all().difference(used).order_by("-payment_date"))


class RentPeriod(models.Model):
    class Meta:
        ordering = ["-payment_date"]

    objects = RentPeriodManager()

    payment_date = models.DateField(
        help_text="The date rent payment is due.",
        unique=True,
    )

    def __str__(self):
        return f"Rent period for {self.payment_date}"

    @staticmethod
    def to_iso_date_list(rent_periods) -> List[str]:
        return [str(rp.payment_date) for rp in rent_periods]


class UpcomingLetterRentPeriodManager(models.Manager):
    def clear_for_user(self, user: JustfixUser):
        self.filter(user=user).delete()

    def set_rent_periods_for_user(self, user: JustfixUser, rps: List[RentPeriod]):
        self.clear_for_user(user)
        self.bulk_create([UpcomingLetterRentPeriod(user=user, rent_period=rp) for rp in set(rps)])

    def set_for_user(self, user: JustfixUser, periods: List[str]):
        self.set_rent_periods_for_user(
            user, [RentPeriod.objects.get_by_iso_date(period) for period in periods]
        )

    def get_rent_periods_for_user(self, user: JustfixUser) -> List[RentPeriod]:
        return [
            ulrp.rent_period
            for ulrp in self.filter(user=user).order_by("rent_period__payment_date")
        ]

    def get_for_user(self, user: JustfixUser) -> List[str]:
        return RentPeriod.to_iso_date_list(self.get_rent_periods_for_user(user))


class UpcomingLetterRentPeriod(models.Model):
    """
    A model used to remember the rent periods a user
    wants their next, upcoming no rent letter to cover.
    """

    class Meta:
        unique_together = ["user", "rent_period"]

    objects = UpcomingLetterRentPeriodManager()

    user = models.ForeignKey(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="upcoming_norent_letter_rent_periods",
    )

    rent_period = models.ForeignKey(
        RentPeriod,
        on_delete=models.CASCADE,
        related_name="+",
    )


class Letter(MailItem):
    """
    A no rent letter that is ready to be sent, or has already been sent.
    """

    class Meta:
        ordering = ["-created_at"]

    user = models.ForeignKey(JustfixUser, on_delete=models.CASCADE, related_name="norent_letters")

    rent_periods = models.ManyToManyField(RentPeriod)

    html_content = models.TextField(
        help_text=("The HTML content of the letter at the time it was sent, in " "English.")
    )

    localized_html_content = models.TextField(
        help_text=(
            "The HTML content of the letter at the time it was sent, in "
            "the user's locale at the time they sent it. If the user's "
            "locale is English, this will be blank (since the English "
            "version is already stored in another field)."
        ),
        blank=True,
    )

    letter_sent_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was mailed."
    )

    letter_emailed_at = models.DateTimeField(
        null=True, blank=True, help_text="When the letter was e-mailed."
    )

    fully_processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the letter was fully processed, i.e. sent to all relevant parties.",
    )

    @property
    def latest_rent_period(self) -> Optional["RentPeriod"]:
        rps = self.rent_periods.order_by("-payment_date")
        if not rps:
            return None
        return rps[0]

    def __get_rent_period_dates_str(self) -> str:
        return ", ".join(
            [str(rp.payment_date) for rp in self.rent_periods.order_by("payment_date")]
        )

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return (
            f"{self.user.full_legal_name}'s no rent letter for "
            f"{self.__get_rent_period_dates_str()}"
        )
