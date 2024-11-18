from decimal import Decimal
from typing import List
from django.db import models
from django.contrib.postgres.fields import ArrayField

from project.common_data import Choices
from project.util.address_form_fields import BOROUGH_FIELD_KWARGS

YES_NO_UNSURE = Choices([("YES", "Yes"), ("NO", "No"), ("UNSURE", "I'm not sure")])

SUBSIDY = Choices(
    [
        ("NYCHA", "NYCHA or RAD/PACT"),
        ("SUBSIDIZED", "Subsidized housing"),
        ("NONE", "None of these"),
        ("UNSURE", "I'm not sure"),
    ]
)

COVERAGE = Choices(
    [
        ("COVERED", "Covered by GCE"),
        ("NOT_COVERED", "Not covered by GCE"),
        ("UNKNOWN", "Unknown if covered by GCE"),
    ]
)

NEXT_STEPS = Choices(
    [("RENT_STABILIZED", "Rent stabilization"), ("PORTFOLIO_SIZE", "Portfolio size")]
)


class GoodCauseEvictionScreenerResponse(models.Model):

    bbl: str = models.CharField(
        help_text="The zero-padded borough, block and lot (BBL) number for the search address property.",
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
    )

    house_number: str = models.TextField(
        help_text="The house number part of street address for the search address property."
    )
    street_name: str = models.TextField(
        help_text="The street name part of street address for the search address property."
    )
    borough: str = models.CharField(
        help_text="The borough of the search address property.", **BOROUGH_FIELD_KWARGS
    )
    zipcode: str = models.CharField(
        help_text="The ZIP code the search address property.", max_length=5
    )

    address_confirmed: bool = models.BooleanField(
        help_text="Whether the user has clicked to confirm the search address is correct.",
        default=False,
    )

    nycdb_results = models.JSONField(
        help_text="Response from the WOW gce/screener API for the search address. Schema may change over time.",
        blank=True,
        null=True,
    )

    form_bedrooms: int = models.SmallIntegerField(
        help_text="User response for number of bedrooms in their apartment.", null=True, blank=True
    )
    form_rent: Decimal = models.DecimalField(
        help_text="User response for monthly rent for their apartment.",
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    form_owner_occupied: str = models.TextField(
        help_text="User response for owner-occupied status of their building.",
        choices=YES_NO_UNSURE.choices,
        null=True,
        blank=True,
    )
    form_rent_stab: str = models.TextField(
        help_text="User response for rent stabilization status of their apartment.",
        choices=YES_NO_UNSURE.choices,
        null=True,
        blank=True,
    )
    form_subsidy: str = models.TextField(
        help_text="User response for subsidy status of their building.",
        choices=SUBSIDY.choices,
        null=True,
        blank=True,
    )

    result_coverage_initial: str = models.TextField(
        help_text="The initial GCE coverage result based on building data and user form responses, but not including any confirmations from next steps",
        choices=COVERAGE.choices,
        null=True,
        blank=True,
    )
    result_next_steps: List[str] = ArrayField(
        help_text="Any eligibility criteria that the user needs to take next steps to confirm.",
        base_field=models.TextField(choices=NEXT_STEPS.choices, null=True, blank=True),
        null=True,
        blank=True,
    )

    next_step_rent_stabilized: str = models.TextField(
        help_text="Updated response from user from the rent stabilization next step.",
        choices=YES_NO_UNSURE.choices,
        blank=True,
        null=True,
    )
    next_step_portfolio_size: str = models.TextField(
        help_text="Updated response from user from the portfolio size next step.",
        choices=YES_NO_UNSURE.choices,
        blank=True,
        null=True,
    )

    result_coverage_final: str = models.TextField(
        help_text="The final GCE coverage result, updating the initial result with any confirmations from next steps.",
        choices=COVERAGE.choices,
        null=True,
        blank=True,
    )
