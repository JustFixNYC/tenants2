from django.db import models

from project.common_data import Choices
from project.util.address_form_fields import BOROUGH_FIELD_KWARGS

COVERAGE = Choices(
    [
        ("COVERED", "Covered by GCE"),
        ("NOT_COVERED", "Not covered by GCE"),
        ("UNKNOWN", "Unknown if covered by GCE"),
    ]
)


class GoodCauseEvictionScreenerResponse(models.Model):

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    bbl: str = models.CharField(
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
        help_text=(
            "The zero-padded borough, block and lot (BBL) number for the "
            "search address property."
        ),
    )

    house_number: str = models.TextField()

    street_name: str = models.TextField()

    borough: str = models.CharField(**BOROUGH_FIELD_KWARGS)

    zipcode: str = models.CharField(max_length=5)

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
