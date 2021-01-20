from django.db import models

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

    has_financial_hardship: bool = models.BooleanField(
        help_text="Whether the user has COVID-19 related financial hardship.",
        default=False,
    )

    has_health_risk: bool = models.BooleanField(
        help_text="Whether the user has COVID-19 related heath risk.",
        default=False,
    )
