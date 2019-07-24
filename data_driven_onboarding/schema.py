from typing import Dict, Any
from pathlib import Path
import logging
from django.db import connections
from django.conf import settings
import graphene

from project import schema_registry, geocoding
from project.util.streaming_json import generate_json_rows
from onboarding.forms import get_geocoding_search_text


MY_DIR = Path(__file__).parent.resolve()

DDO_SQL_FILE = MY_DIR / 'data-driven-onboarding.sql'

RTC_ZIPCODES = set([
    # Brooklyn
    '11216', '11221', '11225', '11226',
    # Bronx
    '10457', '10467', '10468' '10462',
    # Manhattan
    '10026', '10027', '10025', '10031',
    # Queens
    '11433', '11434', '11373' '11385',
    # Staten Island
    '10302', '10303', '10314' '10310',
])

logger = logging.getLogger(__name__)


class DDOSuggestionsResult(graphene.ObjectType):
    # This information is obtained from geocoding.
    full_address = graphene.String(
        required=True,
        description='The full address of the location.'
    )

    bbl = graphene.String(
        required=True,
        description="The 10-digit Borough-Block-Lot (BBL) of the location."
    )

    is_rtc_eligible = graphene.Boolean(
        required=True,
        description="Whether the location is eligible for NYC's Right to Counsel program."
    )

    # This information is obtained from our SQL query.
    zipcode = graphene.String(
        required=True,
        description="The zip code of the location. It may be blank."
    )

    unit_count = graphene.Int(
        description="Number of residential units for the BBL, if available."
    )

    hpd_complaint_count = graphene.Int(
        description=(
            "Number of HPD complaints for the BBL. If there are no listed complaints, "
            "this will be null."
        )
    )

    hpd_open_violation_count = graphene.Int(
        description=(
            "Number of open HPD violations for the BBL. If there are no listed violations, "
            "this will be null."
        )
    )

    associated_building_count = graphene.Int(
        description=(
            "Number of associated buildings from the portfolio that the BBL is in. "
            "If the value is unknown, or if there are no associated buildings, this will be null."
        )
    )

    portfolio_unit_count = graphene.Int(
        description=(
            "The number of residential units in the portfolio that the BBL belongs to. "
            "If the value is unknown, or if there are no associated buildings, this will be null."
        )
    )

    stabilized_unit_count_2007 = graphene.Int(
        required=True,
        description=(
            "The number of rent-stabilized residential units at the BBL in 2007."
        )
    )

    stabilized_unit_count_2017 = graphene.Int(
        required=True,
        description=(
            "The number of rent-stabilized residential units at the BBL in 2017."
        )
    )

    has_stabilized_units = graphene.Boolean(
        required=True,
        description="Whether this building has ever had rent-stabilized units at any point."
    )

    average_wait_time_for_repairs_at_bbl = graphene.Int(
        description=(
            "The average wait time for repairs, in days, after a landlord has been notified "
            "of a violation, if known, for the property."
        )
    )

    average_wait_time_for_repairs_for_portfolio = graphene.Int(
        description=(
            "The average wait time for repairs, in days, after a landlord has been notified "
            "of a violation, if known, for the landlord's entire portfolio."
        )
    )


@schema_registry.register_queries
class DDOQuery:
    ddo_suggestions = graphene.Field(
        DDOSuggestionsResult,
        address=graphene.String(),
        borough=graphene.String(),
    )

    def resolve_ddo_suggestions(self, info, address: str, borough: str):
        if not settings.WOW_DATABASE:
            logger.warning("Data-driven onboarding requires WoW integration.")
            return None
        features = geocoding.search(get_geocoding_search_text(address, borough))
        if not features:
            return None
        props = features[0].properties
        row = run_ddo_sql_query(props.pad_bbl)
        return DDOSuggestionsResult(
            full_address=props.label,
            bbl=props.pad_bbl,
            is_rtc_eligible=row['zipcode'] in RTC_ZIPCODES,
            **row
        )


def run_ddo_sql_query(bbl: str) -> Dict[str, Any]:
    sql_query = DDO_SQL_FILE.read_text()
    with connections[settings.WOW_DATABASE].cursor() as cursor:
        cursor.execute(sql_query, {'bbl': bbl})
        return list(generate_json_rows(cursor))[0]
