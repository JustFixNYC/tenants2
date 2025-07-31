import logging
from django.db import models

from project.common_data import Choices
from project.util.address_form_fields import BOROUGH_FIELD_KWARGS
from project.util import phone_number as pn

COVERAGE = Choices(
    [
        ("COVERED", "Covered by Good Cause"),
        ("NOT_COVERED", "Not covered by Good Cause"),
        ("UNKNOWN", "Unknown if covered by Good Cause"),
        ("RENT_STABILIZED", "Rent stabilized, not covered by Good Cause"),
        ("NYCHA", "NYCHA, not covered by Good Cause"),
        ("SUBSIDIZED", "Subsidized, not covered by Good Cause"),
    ]
)


class GoodCauseEvictionScreenerResponse(models.Model):

    RAPIDPRO_CAMPAIGN = "GCE"

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    phone_number = models.CharField(
        blank=True,
        **pn.get_model_field_kwargs(),
    )

    bbl: str = models.CharField(
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
        help_text=(
            "The zero-padded borough, block and lot (BBL) number for the "
            "search address property."
        ),
        blank=True,
    )

    house_number: str = models.TextField(blank=True)

    street_name: str = models.TextField(blank=True)

    borough: str = models.CharField(blank=True, **BOROUGH_FIELD_KWARGS)

    zipcode: str = models.CharField(max_length=5, blank=True)

    address_confirmed: bool = models.BooleanField(
        help_text="Whether the user has clicked to confirm the search address is correct.",
        default=False,
    )

    nycdb_results = models.JSONField(
        help_text=(
            "Response from the WOW gce/screener API for the search address. "
            "Schema may change over time."
        ),
        blank=True,
        null=True,
    )

    form_answers_initial = models.JSONField(
        help_text=(
            "The initial set of user responses to the survey form saved on submission, before "
            "taking and necessary next steps to confirm criteria."
        ),
        blank=True,
        null=True,
    )

    result_coverage_initial: str = models.TextField(
        help_text=(
            "The initial GCE coverage result based on building data and user form responses, "
            "before taking any necessary next steps to confirm criteria."
        ),
        choices=COVERAGE.choices,
        null=True,
        blank=True,
    )

    result_criteria_initial = models.JSONField(
        help_text=(
            "An object with each GCE criteria and the initial eligibility determination "
            "(eligible, ineligible, unknown), before taking any next steps to confirm criteria."
        ),
        blank=True,
        null=True,
    )

    form_answers_final = models.JSONField(
        help_text=(
            "The final set of user responses to the survey form saved on submission, after "
            "taking any necessary next steps to confirm criteria."
        ),
        blank=True,
        null=True,
    )

    result_coverage_final: str = models.TextField(
        help_text=(
            "The final GCE coverage result taking into account any confirmed "
            "criteria from next steps."
        ),
        choices=COVERAGE.choices,
        null=True,
        blank=True,
    )

    result_criteria_final = models.JSONField(
        help_text=(
            "An object with each GCE criteria and the final eligibility determination "
            "(eligible, ineligible, unknown), after taking any next steps to confirm criteria."
        ),
        blank=True,
        null=True,
    )

    result_url = models.URLField(
        help_text="URL to the detailed results page for this GCE screener response.",
        blank=True,
        null=True,
        max_length=600,  # Increased from default 200 to accommodate longer result links, ~450 chars
    )

    def trigger_followup_campaign_async(self) -> None:
        if not self.phone_number:
            return

        from rapidpro import followup_campaigns as fc

        fc.ensure_followup_campaign_exists(self.RAPIDPRO_CAMPAIGN)

        logging.info(
            f"Triggering rapidpro campaign '{self.RAPIDPRO_CAMPAIGN}' on user " f"{self.pk}."
        )

        custom_fields = {}
        if self.result_url:
            custom_fields["result_url"] = self.result_url

        fc.trigger_followup_campaign_async(
            None,  # We aren't collecting names
            self.phone_number,
            self.RAPIDPRO_CAMPAIGN,
            locale="en",  # We don't support other languages for GCE yet
            custom_fields=custom_fields,
        )
