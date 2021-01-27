from django.db import models
from django.contrib.postgres.fields import JSONField

from users.models import JustfixUser
from project.locales import LOCALE_KWARGS


class HardshipDeclarationDetails(models.Model):
    user = models.OneToOneField(
        JustfixUser,
        on_delete=models.CASCADE,
        related_name="hardship_declaration_details",
        help_text="The user whom these hardship declaration details are for.",
    )

    index_number: str = models.CharField(
        help_text="The user's existing eviction case index number, if any.",
        # No idea how long an index number can actually be, so we'll
        # use a number that's obviously much larger than it.
        max_length=80,
        blank=True,
    )

    has_financial_hardship: bool = models.BooleanField(
        help_text="Whether the user has COVID-19 related financial hardship.",
        default=False,
    )

    has_health_risk: bool = models.BooleanField(
        help_text="Whether the user has COVID-19 related heath risk.",
        default=False,
    )

    def are_ready_for_submission(self) -> bool:
        return self.has_financial_hardship or self.has_health_risk


class SubmittedHardshipDeclaration(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name="submitted_hardship_declaration"
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

    cover_letter_variables = JSONField(
        help_text="The variables used to fill out the cover letter page."
    )

    cover_letter_html = models.TextField(
        help_text="The HTML content of the declaration's cover letter."
    )

    declaration_variables = JSONField(
        help_text="The variables used to fill out the declaration form PDF."
    )

    lob_letter_object = JSONField(
        blank=True,
        null=True,
        help_text=(
            "If the declaration was sent via Lob, this is the JSON response of the API call that "
            "was made to send the letter, documented at https://lob.com/docs/python#letters."
        ),
    )

    tracking_number = models.CharField(
        max_length=100,
        blank=True,
        help_text="The USPS tracking number for the declaration.",
    )

    mailed_at = models.DateTimeField(
        null=True, blank=True, help_text="When the declaration was mailed to the user's landlord."
    )

    emailed_at = models.DateTimeField(
        null=True, blank=True, help_text="When the declaration was e-mailed to the user's landlord."
    )

    emailed_to_housing_court_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the declaration was e-mailed to the user's housing court.",
    )

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"{self.user.full_name}'s hardship declaration"
