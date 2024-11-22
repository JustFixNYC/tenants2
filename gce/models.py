from decimal import Decimal
from typing import Dict, List
from django.db import models
from django.contrib.postgres.fields import ArrayField


from hpaction.models import CURRENCY_KWARGS
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
BEDROOMS = Choices(
    [
        ("STUDIO", "Studio"),
        ("1", "1 Bedroom"),
        ("2", "3 Bedroom"),
        ("4", "3 Bedroom"),
        ("4+", "4+ Bedroom"),
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
        max_length=10,  # One for the borough, 5 for the block, 4 for the lot.
        help_text="The zero-padded borough, block and lot (BBL) number for the search address property.",
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
        help_text="Response from the WOW gce/screener API for the search address. Schema may change over time.",
        blank=True,
        null=True,
    )

    form_bedrooms: str = models.TextField(choices=BEDROOMS.choices, null=True, blank=True)

    form_rent: Decimal = models.DecimalField(**CURRENCY_KWARGS, null=True, blank=True)

    form_owner_occupied: str = models.TextField(
        choices=YES_NO_UNSURE.choices, null=True, blank=True
    )

    form_rent_stab: str = models.TextField(
        help_text="User response to form question about subsidy status.",
        choices=YES_NO_UNSURE.choices,
        null=True,
        blank=True,
    )

    form_subsidy: str = models.TextField(
        help_text="User response to form question about subsidy status.",
        choices=SUBSIDY.choices,
        null=True,
        blank=True,
    )

    result_coverage_initial: str = models.TextField(
        help_text="The initial GCE coverage result based on building data and user form responses, before taking any necessary next steps to confirm criteria.",
        choices=COVERAGE.choices,
        null=True,
        blank=True,
    )

    result_criteria_initial = models.JSONField(
        help_text="An object with each GCE criteria and the initial eligibility determination (eligible, ineligible, unknown), before taking any next steps to confirm criteria.",
        blank=True,
        null=True,
    )

    # TODO: still need to decide what the user flow is going to be for the next step guide pages and what info users will provide. This would be the most simple version
    # result_portfolio_size_confirmed: bool = models.BooleanField(
    #     help_text="Whether or not the user confirmed that their portfolio size is greatner than 10 units on the next step page",
    #     blank=True,
    #     null=True,
    # )

    # result_rent_stabilized_confirmed: bool = models.BooleanField(
    #     help_text="Whether or not the user confirmed that they are rent stabilzied on the next step page",
    #     blank=True,
    #     null=True,
    # )

    result_coverage_final: str = models.TextField(
        help_text="The final GCE coverage result taking into account any confirmed criteria from next steps.",
        choices=COVERAGE.choices,
        null=True,
        blank=True,
    )

    result_criteria_final = models.JSONField(
        help_text="An object with each GCE criteria and the final eligibility determination (eligible, ineligible, unknown), after taking any next steps to confirm criteria.",
        blank=True,
        null=True,
    )
