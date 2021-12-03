from django.db import models
from mailing.models import MailItem
from users.models import JustfixUser


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

    court_name: str = models.CharField(
        help_text="The court the user's existing eviction case is at, if any.",
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


class SubmittedHardshipDeclaration(MailItem):

    user = models.OneToOneField(
        JustfixUser, on_delete=models.CASCADE, related_name="submitted_hardship_declaration"
    )

    cover_letter_variables = models.JSONField(
        help_text="The variables used to fill out the cover letter page."
    )

    cover_letter_html = models.TextField(
        help_text="The HTML content of the declaration's cover letter."
    )

    declaration_variables = models.JSONField(
        help_text="The variables used to fill out the declaration form PDF."
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

    emailed_to_user_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the declaration was e-mailed to the user.",
    )

    fully_processed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=(
            "When the declaration was fully processed, i.e. sent to all relevant " "parties."
        ),
    )

    def __str__(self):
        if not self.pk:
            return super().__str__()
        return f"{self.user.full_legal_name}'s hardship declaration"
